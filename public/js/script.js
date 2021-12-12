document.addEventListener('DOMContentLoaded', function () {
    fetch('http://34.74.152.145:3000/getAll')
    .then(response => response.json())
    .then(data => loadHTMLTable(data['data']));
});

const video = document.getElementById('videoInput')

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models') //heavier/accurate version of tiny face detector
]).then(start)

function start() {
    //document.body.append('Models Loaded')
    
    // navigator.getUserMedia(
    //     navigator.mediaDevices.getUserMedia(
    //         { video:{} },
    //         stream => video.srcObject = stream,
    //         err => console.error(err)
    //     )
    // )
    
    var constraints = { audio: false, video: {} }; 

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
        var video = document.querySelector('#videoInput');
        video.srcObject = mediaStream;
        
    })
    .catch(function(err) { console.log(err.name + ": " + err.message); });

    //video.src = '../videos/speech.mp4'
    console.log('video added')
    recognizeFaces()
}

async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    video.addEventListener('play', async () => {
        console.log('Playing')
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)

        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)

        

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            //console.log(results[0].label)

            var labelResult = results[0].label;
            if (labelResult) {
                document.getElementById('name-input').value = labelResult;
                //console.log(labelResult)
            } else {
                console.log("Error");
            }

            results.forEach( (result, i) => {
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
                //console.log(drawBox.options.label)
            })

            
        }, 100)

    })
}


function loadLabeledImages() {
    const labels = ['ChingHo', 'Elizabeth Olsen', 'Emilia Clarke', 'Henry Cavill', 'Robert John Downey Jr.', 
    'Scarlett Johansson', 'TingWei', 'Tom Hiddleston', 'Tom Holland', 'YingHsuan'] // for WebCam
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=10; i++) {
                const img = await faceapi.fetchImage(`../labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            //document.body.append(label+' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}



//grab something that already exits in the HTML in the Dom on page load
document.querySelector('table tbody').addEventListener('click', function(event) {
    if (event.target.className === "delete-row-btn") {
        deleteRowById(event.target.dataset.id);
    }
    if (event.target.className === "edit-row-btn") {
        handleEditRow(event.target.dataset.id);
    }
});

const updateBtn = document.querySelector('#update-row-btn');
const searchBtn = document.querySelector('#search-btn');

searchBtn.onclick = function() {
    const searchValue = document.querySelector('#search-input').value;

    fetch('http://34.74.152.145:3000/search/' + searchValue)
    .then(response => response.json())
    .then(data => loadHTMLTable(data['data']));
}

function deleteRowById(id) {
    fetch('http://34.74.152.145:3000/delete/' + id, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}

function handleEditRow(id) {
    const updateSection = document.querySelector('#update-row');
    updateSection.hidden = false;
    document.querySelector('#update-name-input').dataset.id = id;
}

updateBtn.onclick = function() {
    const updateNameInput = document.querySelector('#update-name-input');
    fetch('http://34.74.152.145:3000/update', {
        method: 'PATCH',
        headers: {
            'Content-type' : 'application/json'
        },
        body: JSON.stringify({
            id: updateNameInput.dataset.id,
            name: updateNameInput.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}


const addBtn = document.querySelector('#add-name-btn');

addBtn.onclick = function () {
    const nameInput = document.querySelector('#name-input');

    //grab the value and everytime send it to backend, reset the value to an empty string
    const name = nameInput.value;
    nameInput.value = "";

    fetch('http://34.74.152.145:3000/insert', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ name : name})
    })
    .then(response => response.json())
    .then(data => insertRowIntoTable(data['data']));
}

//create a new row
function insertRowIntoTable(data) {
    const table = document.querySelector('table tbody');

    //need to check for if there's no data
    const isTableData = table.querySelector('.no-data');

    let tableHtml = "<tr>";

    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (key === 'dateAdded') {
                data[key] = new Date(data[key]).toLocaleString();
            }
            tableHtml += `<td>${data[key]}</td>`;
        }
    }

    tableHtml += `<td><button class="delete-row-btn" data-id=${data.id}>Delete</td>`;
    tableHtml += `<td><button class="edit-row-btn" data-id=${data.id}>Edit</td>`;


    tableHtml += "</tr>";

    if (isTableData) {
        table.innerHTML = tableHtml;
    } else {
        const newRow = table.insertRow();
        newRow.innerHTML = tableHtml;
    }
}

function loadHTMLTable(data) {
    const table = document.querySelector('table tbody');
    //console.log(data);

    if (data.length === 0) {
        table.innerHTML = "<tr><td class='no-data' colspan='5'>No Data</td></tr>";
        return;
    }

    //retrieving all the values back from the database
    let tableHtml = "";

    data.forEach(function ({id, name, date_added}){
        tableHtml += "<tr>";
        tableHtml += `<td>${id}</td>`;
        tableHtml += `<td>${name}</td>`;
        tableHtml += `<td>${new Date(date_added).toLocaleString()}</td>`;
        tableHtml += `<td><button class="delete-row-btn" data-id=${id}>Delete</td>`;
        tableHtml += `<td><button class="edit-row-btn" data-id=${id}>Edit</td>`;
        tableHtml += "</tr>";
    });
    table.innerHTML = tableHtml;
}