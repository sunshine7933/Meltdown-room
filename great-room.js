
(function(){
  document.querySelectorAll('[data-great-room]').forEach(function(button){
    button.addEventListener('click',function(){
      var menu=document.querySelector('#great .great-room-menu');if(menu)menu.open=false;
      showScreen(button.dataset.greatRoom);
    });
  });
  var menu=document.querySelector('#great .great-room-menu');
  if(menu)menu.addEventListener('click',function(event){if(event.target.closest('button'))menu.open=false;});
})();
