function toggleContent(id){

const content = document.getElementById(id);

document.querySelectorAll('.content-box').forEach(item=>{
if(item !== content){
item.classList.remove('active');
}
});

content.classList.toggle('active');

}
function openImage(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");

    modalImg.src = img.src;
    modal.classList.add("active");
}

function closeImage() {
    document.getElementById("imageModal").classList.remove("active");
}
