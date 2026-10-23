// Public marketing-page counts only. Never include this file in private app pages.
(()=>{
 'use strict';
 if(window.top!==window.self)return;
 if(!['themeltdownroom.com','www.themeltdownroom.com'].includes(location.hostname))return;
 if(!['/','/index.html'].includes(location.pathname)||location.search||location.hash)return;
 if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
 try{if(document.referrer){const ref=new URL(document.referrer);if(ref.search||ref.hash)return}}catch{return}
 if(document.querySelector('script[data-cf-beacon]'))return;
 const script=document.createElement('script');
 script.type='module';
 script.src='https://static.cloudflareinsights.com/beacon.min.js';
 script.setAttribute('data-cf-beacon',JSON.stringify({token:'e8a8e20f64d441d6a75203e8d2f85afc',spa:false}));
 document.head.appendChild(script);
})();
