// ====== FITUR BERANDA ======
let projectAkanDihapus = "";
let kodeKonfirmasiSekarang = "";

function cekCookie() {
    if (!localStorage.getItem('cookieDiterima')) {
        document.getElementById('cookie-banner').style.display = 'block';
    }
}

function terimaCookie() {
    localStorage.setItem('cookieDiterima', 'true');
    document.getElementById('cookie-banner').style.display = 'none';
}

function buatProject() {
    let nama = document.getElementById('input-nama-project').value.trim();
    if (nama) {
        let projects = JSON.parse(localStorage.getItem('daus_projects')) || {};
        if (!projects[nama]) {
            projects[nama] = { data: null, status: 'Baru' };
            localStorage.setItem('daus_projects', JSON.stringify(projects));
        }
        window.location.href = `project.html?nama=${encodeURIComponent(nama)}`;
    }
}

function tampilkanListProject() {
    let listArea = document.getElementById('list-project');
    if (!listArea) return;
    
    let projects = JSON.parse(localStorage.getItem('daus_projects')) || {};
    listArea.innerHTML = '';
    
    for (let nama in projects) {
        listArea.innerHTML += `
            <div class="project-item">
                <div>
                    <h3>${nama}</h3>
                    <small>Status: ${projects[nama].status}</small>
                </div>
                <div>
                    <button onclick="window.location.href='project.html?nama=${encodeURIComponent(nama)}'">Edit</button>
                    ${projects[nama].data ? `<button onclick="downloadGambar('${nama}')">Unduh</button>` : ''}
                    <button class="btn-hapus" onclick="siapkanHapus('${nama}')">Hapus</button>
                </div>
            </div>
        `;
    }
}

function downloadGambar(nama) {
    let projects = JSON.parse(localStorage.getItem('daus_projects'));
    if (projects[nama] && projects[nama].data) {
        let a = document.createElement('a');
        a.href = projects[nama].data;
        a.download = `${nama}_DausXD.png`;
        a.click();
    }
}

// Fitur Keamanan Hapus
function siapkanHapus(nama) {
    projectAkanDihapus = nama;
    document.getElementById('nama-target-hapus').innerText = nama;
    kodeKonfirmasiSekarang = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('tampilan-kode-acak').innerText = kodeKonfirmasiSekarang;
    document.getElementById('input-konfirmasi-kode').value = "";
    document.getElementById('popup-hapus').style.display = 'flex';
}

function eksekusiHapus() {
    let inputUser = document.getElementById('input-konfirmasi-kode').value;
    if (inputUser === kodeKonfirmasiSekarang) {
        let projects = JSON.parse(localStorage.getItem('daus_projects')) || {};
        delete projects[projectAkanDihapus];
        localStorage.setItem('daus_projects', JSON.stringify(projects));
        document.getElementById('popup-hapus').style.display = 'none';
        tampilkanListProject();
        alert("Project berhasil dihapus.");
    } else {
        alert("Kode salah! Penghapusan dibatalkan.");
    }
}


// ====== FITUR HALAMAN PROJECT (CANVAS) ======
let canvas, ctx;
let isDrawing = false;
let historyArray = [], historyIndex = -1;

function initCanvas() {
    canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 150;
    
    // Background putih dasar
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const urlParams = new URLSearchParams(window.location.search);
    const namaProject = urlParams.get('nama');
    if (namaProject) {
        document.getElementById('nama-project-saat-ini').value = namaProject;
        muatGambar(namaProject);
    }

    simpanState(); // Simpan state awal

    // Event Listener untuk Mouse & Layar Sentuh
    canvas.addEventListener('mousedown', mulaiGambar);
    canvas.addEventListener('mousemove', prosesGambar);
    canvas.addEventListener('mouseup', hentiGambar);
    
    canvas.addEventListener('touchstart', mulaiGambar);
    canvas.addEventListener('touchmove', prosesGambar);
    canvas.addEventListener('touchend', hentiGambar);
}

function mulaiGambar(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.lineWidth = document.getElementById('ukuran-kuas').value;
    ctx.lineCap = 'round';
    ctx.strokeStyle = document.getElementById('input-warna').value; 
    prosesGambar(e);
}

function prosesGambar(e) {
    if (!isDrawing) return;
    e.preventDefault();
    let x = e.clientX || e.touches[0].clientX;
    let y = e.clientY || e.touches[0].clientY;
    
    let rect = canvas.getBoundingClientRect();
    ctx.lineTo(x - rect.left, y - rect.top);
    ctx.stroke();
}

function hentiGambar() {
    if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
        simpanState();
    }
}

// Fitur Hapus Semua (Clear Canvas)
function hapusSemuaKuas() {
    let konfirmasi = confirm("Apakah kamu yakin ingin menghapus semua coretan di canvas ini?");
    if (konfirmasi) {
        ctx.fillStyle = "#ffffff"; // Kembalikan ke warna putih
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        simpanState(); // Simpan state agar bisa di-undo jika salah pencet
    }
}

// Fitur Undo & Redo
function simpanState() {
    if (historyIndex < historyArray.length - 1) {
        historyArray = historyArray.slice(0, historyIndex + 1);
    }
    historyArray.push(canvas.toDataURL());
    historyIndex++;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState();
    }
}

function redo() {
    if (historyIndex < historyArray.length - 1) {
        historyIndex++;
        restoreState();
    }
}

function restoreState() {
    let img = new Image();
    img.src = historyArray[historyIndex];
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

// Simpan Data
function tanganiSimpan(aksi) {
    let namaLama = new URLSearchParams(window.location.search).get('nama');
    let namaBaru = document.getElementById('nama-project-saat-ini').value.trim();
    let projects = JSON.parse(localStorage.getItem('daus_projects')) || {};
    
    if (namaLama !== namaBaru) {
        delete projects[namaLama];
        window.history.replaceState(null, '', `?nama=${encodeURIComponent(namaBaru)}`);
    }

    projects[namaBaru] = {
        data: canvas.toDataURL("image/png"),
        status: aksi === 'draf' ? 'Draf' : 'Tersimpan Final'
    };
    
    localStorage.setItem('daus_projects', JSON.stringify(projects));
    alert(`Project berhasil disimpan sebagai ${aksi}!`);
    document.getElementById('opsi-simpan').value = ""; 
}

function muatGambar(nama) {
    let projects = JSON.parse(localStorage.getItem('daus_projects')) || {};
    if (projects[nama] && projects[nama].data) {
        let img = new Image();
        img.src = projects[nama].data;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            simpanState(); 
        };
    }
}
