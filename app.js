    function openAccountPanel(){var shade=document.getElementById("accountShade");if(shade)shade.hidden=false;setTimeout(function(){var e=document.querySelector("#accountShade button");if(e)e.focus()},20)}
    function closeAccountPanel(e){var shade=document.getElementById("accountShade");if(!shade||(e&&e.target!==shade))return;shade.hidden=true;document.getElementById("accountButton").focus()}
    document.addEventListener("keydown",function(e){var shade=document.getElementById("accountShade");if(e.key==="Escape"&&shade&&!shade.hidden)closeAccountPanel()});

    var currentRoom = "home";
    var previousRoom = "home";

    function updateHomeClock() {
      var now = new Date(), timeNode = document.getElementById("homeLiveTime"), dateNode = document.getElementById("homeLiveDate");
      if (timeNode) timeNode.textContent = now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
      if (dateNode) dateNode.textContent = now.toLocaleDateString([], {month:"short",day:"numeric"})+" • "+Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g," ");
    }
    updateHomeClock();
    setInterval(updateHomeClock,30000);
    document.addEventListener("visibilitychange",function(){if(!document.hidden)updateHomeClock()});

    function showScreen(id) {
      if (id === "home") id = "retreat";
      if (!document.getElementById(id)) id = "retreat";
      if (id !== currentRoom) cleanUpRoomBeforeLeaving(currentRoom);
      document.querySelectorAll(".screen").forEach(function(screen) {
        screen.classList.remove("active");
      });

      var target = document.getElementById(id);
      if (!target) return;

      if (id !== currentRoom) { previousRoom = currentRoom; currentRoom = id; }
      target.classList.add("active");
      if (typeof updateCompanionDock === "function") updateCompanionDock(id);
      if (id === "resources" && typeof initResourceShed === "function") initResourceShed();
      if (id === "explore" && typeof initExploreNearMe === "function") initExploreNearMe();
      if (id === "game" && typeof initGameRoom === "function") initGameRoom();
      if (id === "outdoor" && typeof initOutdoorRoom === "function") initOutdoorRoom();


      if (history.replaceState) {
        history.replaceState(null, "", new URL("#" + id, window.location.href).href);
      }

      window.scrollTo(0, 0);
    }

    function cleanUpRoomBeforeLeaving(id) {
      if (id === "outdoor" && typeof stopOutdoorSounds === "function") stopOutdoorSounds();
      if (id === "game" && typeof stopGameBeat === "function") stopGameBeat();
      if (id === "outdoor" && outdoorBreathTimer) { clearInterval(outdoorBreathTimer); outdoorBreathTimer = null; }
      if (id === "meltdown" && typeof closeMeltdownTool === "function") closeMeltdownTool();
      if (id === "thinking" && typeof closeThinkingTool === "function") closeThinkingTool();
      if (id === "calm") {
        if (typeof stopCalmSound === "function") stopCalmSound();
        if (typeof closeCalmReflection === "function") closeCalmReflection();
      }
      if (id === "hope") {
        clearInterval(hopeQuietTimer);
        if (typeof closeHopeTool === "function") closeHopeTool();
      }
      if (id === "celebration" && typeof closeCelebrationTool === "function") closeCelebrationTool();
      if (id === "learn" && typeof closeLearnWorkspace === "function") closeLearnWorkspace();
      if (id === "rant" && burnReleaseDialog && burnReleaseDialog.classList.contains("open")) returnFromBurn();
    }

    function goBackRoom() {
      showScreen(previousRoom && previousRoom !== currentRoom ? previousRoom : "home");
    }

    var stillModeButton = document.getElementById("stillModeButton");
    function setStillMode(enabled) {
      document.body.classList.toggle("still-mode", enabled);
      stillModeButton.setAttribute("aria-pressed", String(enabled));
      stillModeButton.textContent = enabled ? "EXIT STILL MODE" : "STILL MODE";
      localStorage.setItem("meltdownStillMode", enabled ? "on" : "off");
    }
    function toggleStillMode() { setStillMode(!document.body.classList.contains("still-mode")); }
    setStillMode(localStorage.getItem("meltdownStillMode") === "on");

    var rantText = document.getElementById("rantText");
    var rantStatus = document.getElementById("rantStatus");
    var statusTimer;
    var burnReleaseDialog = document.getElementById("burnReleaseDialog");
    var burnFireplace = document.getElementById("burnFireplace");
    var burnPaper = document.getElementById("burnPaper");
    var dragFlame = document.getElementById("dragFlame");
    var ashBed = document.getElementById("ashBed");
    var burnProgressBar = document.getElementById("burnProgressBar");
    var burnReleaseStatus = document.getElementById("burnReleaseStatus");
    var burnFinished = document.getElementById("burnFinished");
    var burnProgress = 0;
    var burnActive = false;
    var burnPaused = false;
    var flameHeld = false;


    function setRantStatus(message) {
      rantStatus.textContent = message;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function() { rantStatus.textContent = ""; }, 3500);
    }

    function storeDraft() {
      localStorage.setItem("meltdownRantDraft", rantText.value);
    }

    function saveRant() {
      var text = rantText.value.trim();
      if (!text) {
        setRantStatus("Write something first — this space is yours.");
        rantText.focus();
        return;
      }
      var saved = JSON.parse(localStorage.getItem("meltdownPrivateRants") || "[]");
      saved.push({ text: text, savedAt: new Date().toISOString() });
      localStorage.setItem("meltdownPrivateRants", JSON.stringify(saved));
      storeDraft();
      setRantStatus("Saved privately on this device.");
    }

    var releaseRantArmed = false;
    var releaseRantTimer;
    function releaseRant() {
      if (!rantText.value.trim()) { setRantStatus("There is nothing to release yet."); return; }
      if (!releaseRantArmed) {
        releaseRantArmed = true;
        clearTimeout(releaseRantTimer);
        releaseRantTimer = setTimeout(function() { releaseRantArmed = false; }, 6000);
        setRantStatus("Tap Release It again to clear these words.");
        return;
      }
      releaseRantArmed = false;
      clearTimeout(releaseRantTimer);
      rantText.value = "";
      localStorage.removeItem("meltdownRantDraft");
      setRantStatus("Released. Take a breath.");
      rantText.focus();
    }

    function burnRant() {
      var text = rantText.value.trim();
      if (!text) {
        setRantStatus("Write something first, then tap Burn It.");
        rantText.focus();
        return;
      }
      burnPaper.textContent = text;
      burnReleaseDialog.classList.add("open");
      document.body.style.overflow = "hidden";
      resetInteractiveBurn();
      burnReleaseStatus.textContent = "Your words are still safe. Start only when you are ready.";
    }

    function startInteractiveBurn() {
      if (burnActive) return;
      if (document.getElementById("burnKeepCopy").checked) {
        var saved = JSON.parse(localStorage.getItem("meltdownPrivateRants") || "[]");
        saved.push({ text: rantText.value, savedAt: new Date().toISOString(), source: "burn-release-copy" });
        localStorage.setItem("meltdownPrivateRants", JSON.stringify(saved));
      }
      if (document.getElementById("burnAnonymous").checked) {
        burnPaper.textContent = "These words are mine to release. The details do not have to follow me.";
      }
      burnActive = true;
      burnPaused = false;
      burnPaper.classList.add("ready");
      burnFireplace.classList.add("active");
      document.getElementById("startBurnButton").disabled = true;
      document.getElementById("pauseBurnButton").disabled = false;
      document.getElementById("resetBurnButton").disabled = false;
      burnReleaseStatus.textContent = "Hold and drag the flame across the paper. You control the pace.";
    }

    function placeBurnMark(event) {
      if (!burnActive || burnPaused || !flameHeld) return;
      var rect = burnPaper.getBoundingClientRect();
      var x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      var y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      var mark = document.createElement("span");
      mark.className = "burn-mark";
      mark.style.left = x + "px";
      mark.style.top = y + "px";
      burnPaper.appendChild(mark);
      burnProgress = Math.min(100, burnProgress + 4);
      burnProgressBar.style.width = burnProgress + "%";
      if (burnProgress >= 24) burnPaper.classList.add("curling");
      if (burnProgress >= 52) burnPaper.classList.add("holed");
      dropAsh(event.clientX, event.clientY);
      if (burnProgress >= 100) finishInteractiveBurn();
    }

    function moveFlame(event) {
      if (!burnActive || burnPaused) return;
      var rect = burnFireplace.getBoundingClientRect();
      dragFlame.style.left = (event.clientX - rect.left) + "px";
      dragFlame.style.top = (event.clientY - rect.top) + "px";
      placeBurnMark(event);
    }

    function dropAsh(clientX, clientY) {
      var rect = burnFireplace.getBoundingClientRect();
      var ash = document.createElement("span");
      ash.className = "ash-particle";
      ash.style.left = (clientX - rect.left) + "px";
      ash.style.top = (clientY - rect.top) + "px";
      ash.style.setProperty("--drift", ((Math.random() * 50) - 25) + "px");
      burnFireplace.appendChild(ash);
      setTimeout(function() { ash.remove(); }, 1900);
    }

    function finishInteractiveBurn() {
      burnActive = false;
      flameHeld = false;
      burnFireplace.classList.remove("active");
      burnPaper.classList.add("ashes");
      ashBed.classList.add("show");
      burnFinished.classList.add("show");
      burnReleaseStatus.textContent = "The paper has turned to ash. Breathe. You released it.";
      document.getElementById("pauseBurnButton").disabled = true;
      rantText.value = "";
      localStorage.removeItem("meltdownRantDraft");
      setRantStatus("It has turned to ash. Let it go.");
    }

    function toggleBurnPause() {
      if (!burnActive) return;
      burnPaused = !burnPaused;
      document.getElementById("pauseBurnButton").textContent = burnPaused ? "RESUME" : "PAUSE";
      burnFireplace.classList.toggle("active", !burnPaused);
      burnReleaseStatus.textContent = burnPaused ? "Paused. Your progress is safe." : "Continue dragging the flame when you are ready.";
    }

    function resetInteractiveBurn() {
      burnProgress = 0;
      burnActive = false;
      burnPaused = false;
      flameHeld = false;
      burnPaper.textContent = rantText.value.trim();
      burnPaper.className = "burn-paper";
      burnPaper.querySelectorAll(".burn-mark").forEach(function(mark) { mark.remove(); });
      burnFireplace.querySelectorAll(".ash-particle").forEach(function(ash) { ash.remove(); });
      burnFireplace.classList.remove("active");
      ashBed.classList.remove("show");
      burnFinished.classList.remove("show");
      burnProgressBar.style.width = "0%";
      document.getElementById("startBurnButton").disabled = false;
      document.getElementById("pauseBurnButton").disabled = true;
      document.getElementById("pauseBurnButton").textContent = "PAUSE";
      document.getElementById("resetBurnButton").disabled = true;
      burnReleaseStatus.textContent = "Reset. Your original writing is still safe.";
    }

    function cancelInteractiveBurn() {
      if (burnProgress >= 100) {
        returnFromBurn();
        return;
      }
      resetInteractiveBurn();
      burnReleaseDialog.classList.remove("open");
      document.body.style.overflow = "";
      setRantStatus("Burn canceled. Your writing is still here.");
      rantText.focus();
    }

    function clearBurnPage() {
      if (!window.confirm("Clear this page without burning it?")) return;
      rantText.value = "";
      localStorage.removeItem("meltdownRantDraft");
      burnPaper.textContent = "";
      returnFromBurn();
      setRantStatus("The page was cleared.");
    }

    function returnFromBurn() {
      burnReleaseDialog.classList.remove("open");
      document.body.style.overflow = "";
      resetInteractiveBurn();
      rantText.focus();
    }

    burnFireplace.addEventListener("pointerdown", function(event) {
      if (!burnActive || burnPaused) return;
      flameHeld = true;
      burnFireplace.setPointerCapture(event.pointerId);
      moveFlame(event);
    });
    burnFireplace.addEventListener("pointermove", moveFlame);
    burnFireplace.addEventListener("pointerup", function(event) {
      flameHeld = false;
      if (burnFireplace.hasPointerCapture(event.pointerId)) burnFireplace.releasePointerCapture(event.pointerId);
    });
    burnFireplace.addEventListener("pointercancel", function() { flameHeld = false; });

    function newRant() {
      if (rantText.value.trim() && !window.confirm("Start fresh and clear this draft?")) return;
      rantText.value = "";
      localStorage.removeItem("meltdownRantDraft");
      setRantStatus("A fresh page is ready.");
      rantText.focus();
    }

    function shareRant() {
      setRantStatus("Anonymous sharing is coming soon. Nothing was posted.");
    }

    rantText.value = localStorage.getItem("meltdownRantDraft") || "";
    rantText.addEventListener("input", storeDraft);

    var meltdownStage = document.getElementById("meltdownStage");
    var meltdownStatus = document.getElementById("meltdownStatus");
    var meltdownTool = document.getElementById("meltdownTool");
    var meltdownToolTitle = document.getElementById("meltdownToolTitle");
    var meltdownToolBody = document.getElementById("meltdownToolBody");
    var calmInterval;

    function closeMeltdownTool() {
      meltdownTool.classList.remove("open");
      meltdownToolBody.innerHTML = "";
      clearInterval(calmInterval);
      meltdownStage.classList.remove("recovering");
    }

    function toolButton(label, action, kind) {
      return '<button type="button" class="' + (kind || "") + '" data-mr-action="' + action + '">' + label + '</button>';
    }

    function openMeltdownTool(tool) {
      clearInterval(calmInterval);
      meltdownStage.classList.remove("recovering");
      meltdownTool.classList.add("open");
      var title = "";
      var body = "";
      if (tool === "menu") {
        title = "Menu";
        body = '<p>Where would you like to go?</p><div class="tool-actions">' +
          toolButton("GREAT ROOM","showScreen(\'great\'); closeMeltdownTool()","primary") +
          toolButton("RANT ROOM","showScreen(\'rant\'); closeMeltdownTool()") +
          toolButton("THINKING ROOM","showScreen(\'thinking\'); closeMeltdownTool()") +
          toolButton("PROPERTY MAP","showScreen(\'map\'); closeMeltdownTool()") +
          toolButton("HOME","showScreen(\'home\'); closeMeltdownTool()") + '</div>';
      } else if (tool === "settings") {
        title = "Settings";
        var still = document.body.classList.contains("still-mode");
        body = '<p>Choose the room experience that feels best.</p><div class="tool-actions">' +
          toolButton(still ? "TURN ANIMATION ON" : "USE STILL MODE","toggleStillMode(); openMeltdownTool(\'settings\')","primary") +
          toolButton("CLEAR PRIVATE JOURNAL","clearMeltdownJournal()","danger") +
          toolButton("CLEAR MY NOTES","clearSupportNotes()","danger") + '</div><p class="meltdown-inline-status" id="meltdownToolStatus"></p>';
      } else if (tool === "letout") {
        title = "I Need to Let It Out";
        body = '<p>Choose what feels right. There is no wrong choice.</p><div class="tool-actions">' +
          toolButton("WRITE IT OUT","openMeltdownTool(\'journal\')","primary") +
          toolButton("CALM MY BODY","openMeltdownTool(\'calm\')") +
          toolButton("LEAVE A NOTE","openMeltdownTool(\'notes\')") +
          toolButton("FAMILY & FUN","showScreen(\'game\'); closeMeltdownTool()","danger") + '</div>';
      } else if (tool === "journal") {
        title = "My Private Journal";
        body = '<p>Write, rant, and get it out. This stays on this device.</p><textarea id="meltdownJournal" placeholder="This is your private space..."></textarea><div class="tool-actions">' +
          toolButton("SAVE PRIVATELY","saveMeltdownJournal()","primary") +
          toolButton("RELEASE & CLEAR","releaseMeltdownJournal()","danger") + '</div><p class="meltdown-inline-status" id="meltdownToolStatus"></p>';
      } else if (tool === "calm") {
        title = "Calm Down Corner";
        body = '<p id="calmWords">Tap Start Breathing when you are ready.</p><div class="calm-circle" id="calmCircle"></div><div class="tool-actions">' +
          toolButton("START BREATHING","startMeltdownBreathing()","primary") +
          toolButton("STOP","stopMeltdownBreathing()") + '</div>';
      } else if (tool === "notes") {
        title = "Note Wall";
        body = '<p>Leave a private note of support for yourself.</p><textarea id="supportNoteInput" placeholder="You matter. You are doing your best..."></textarea><div class="tool-actions">' +
          toolButton("ADD TO WALL","addSupportNote()","primary") + '</div><div class="note-wall-list" id="supportNoteList"></div><p class="meltdown-inline-status" id="meltdownToolStatus"></p>';
      } else if (tool === "checkin") {
        title = "Daily Check-In";
        body = '<p>How are you feeling today?</p><div class="feeling-grid">' +
          ["CALM","SAD","ANGRY","ANXIOUS","OVERWHELMED","I DON'T KNOW"].map(function(feel){ return toolButton(feel,"saveCheckIn('"+feel.replace("'","\\'")+"')"); }).join("") +
          '</div><p class="meltdown-inline-status" id="meltdownToolStatus"></p>';
      } else if (tool === "reminder") {
        title = "A Reminder for You";
        body = '<p style="font-size:clamp(22px,4vw,38px);font-family:Georgia,serif">You’re human. Not perfect.</p><p>You do not have to solve everything right now. One breath, one feeling, and one small step at a time is enough.</p><div class="tool-actions">' +
          toolButton("VISIT CALM DOWN CORNER","openMeltdownTool(\'calm\')","primary") + '</div>';
      }
      meltdownToolTitle.textContent = title;
      meltdownToolBody.innerHTML = body;
      if (tool === "journal") document.getElementById("meltdownJournal").value = localStorage.getItem("meltdownPrivateJournal") || "";
      if (tool === "notes") renderSupportNotes();
      meltdownStatus.textContent = title + " opened.";
    }

    function toolStatus(message) {
      var status = document.getElementById("meltdownToolStatus");
      if (status) status.textContent = message;
      meltdownStatus.textContent = message;
    }
    function saveMeltdownJournal() {
      var journal = document.getElementById("meltdownJournal");
      if (!journal.value.trim()) { toolStatus("Write something first. This space is yours."); return; }
      localStorage.setItem("meltdownPrivateJournal", journal.value);
      toolStatus("Saved privately on this device.");
    }
    function releaseMeltdownJournal() {
      var journal = document.getElementById("meltdownJournal");
      if (!journal || !journal.value.trim()) { toolStatus("There is nothing to release yet."); return; }
      if (!window.confirm("Release and permanently clear this private journal page?")) return;
      journal.value = "";
      localStorage.removeItem("meltdownPrivateJournal");
      toolStatus("Released. The page is clear.");
    }
    function clearMeltdownJournal() {
      if (!localStorage.getItem("meltdownPrivateJournal")) { toolStatus("The private journal is already clear."); return; }
      if (!window.confirm("Clear the saved private journal from this device?")) return;
      localStorage.removeItem("meltdownPrivateJournal");
      toolStatus("Private journal cleared.");
    }
    function startMeltdownBreathing() {
      var circle = document.getElementById("calmCircle");
      var words = document.getElementById("calmWords");
      circle.classList.add("breathing");
      meltdownStage.classList.add("recovering");
      var inhale = true;
      words.textContent = "Breathe in slowly…";
      clearInterval(calmInterval);
      calmInterval = setInterval(function(){ inhale = !inhale; words.textContent = inhale ? "Breathe in slowly…" : "Breathe out gently…"; },4000);
      meltdownStatus.textContent = "Follow the breathing light.";
    }
    function stopMeltdownBreathing() {
      clearInterval(calmInterval);
      var circle = document.getElementById("calmCircle");
      if (circle) circle.classList.remove("breathing");
      meltdownStage.classList.remove("recovering");
      var words = document.getElementById("calmWords");
      if (words) words.textContent = "You can return whenever you need.";
    }
    function getSupportNotes() { try { return JSON.parse(localStorage.getItem("meltdownSupportNotes") || "[]"); } catch(e) { return []; } }
    function renderSupportNotes() {
      var list = document.getElementById("supportNoteList");
      if (!list) return;
      var notes = getSupportNotes();
      list.innerHTML = notes.length ? notes.map(function(note){ var item=document.createElement("div"); item.className="support-note"; item.textContent=note; return item.outerHTML; }).join("") : "<p>Your note wall is ready.</p>";
    }
    function addSupportNote() {
      var input = document.getElementById("supportNoteInput");
      if (!input.value.trim()) { toolStatus("Write a note first."); return; }
      var notes = getSupportNotes(); notes.unshift(input.value.trim()); notes = notes.slice(0,12);
      localStorage.setItem("meltdownSupportNotes",JSON.stringify(notes)); input.value=""; renderSupportNotes(); toolStatus("Your support note is on the wall.");
    }
    function clearSupportNotes() { var notes=getSupportNotes();if(!notes.length){toolStatus("The Note Wall is already clear.");return;}if(!window.confirm("Clear every private note from the Note Wall?"))return;localStorage.removeItem("meltdownSupportNotes");renderSupportNotes();toolStatus("Note Wall cleared."); }
    function saveCheckIn(feeling) {
      localStorage.setItem("meltdownDailyCheckIn",JSON.stringify({feeling:feeling,date:new Date().toISOString()}));
      toolStatus("Checked in: " + feeling + ". Thank you for noticing how you feel.");
    }

    var axeThrows = 0;
    var axeScore = 0;
    var axeRange = document.getElementById("axeRange");
    var axeTarget = document.getElementById("axeTarget");
    var axeMark = document.getElementById("axeMark");
    var axeStatus = document.getElementById("axeStatus");
    var axeStart = null;
    function throwAxe(startX, startY, endX, endY, duration) {
      var rangeBox = axeRange.getBoundingClientRect();
      var targetBox = axeTarget.getBoundingClientRect();
      var swipeY = startY - endY;
      var swipeX = endX - startX;
      if (swipeY < 70 || duration > 1200) {
        axeStatus.textContent = "Swipe upward faster from the stand-back line.";
        return;
      }
      var force = Math.max(.55, Math.min(1.15, swipeY / (rangeBox.height * .58)));
      var x = Math.max(8, Math.min(92, 50 + swipeX / rangeBox.width * 120));
      var y = Math.max(8, Math.min(92, 50 - (force - .88) * 85));
      var distance = Math.hypot(x - 50, y - 50);
      var points = distance < 10 ? 10 : distance < 20 ? 7 : distance < 32 ? 5 : distance < 43 ? 3 : 1;
      axeThrows += 1; axeScore += points;
      var targetCenterX = targetBox.left - rangeBox.left + targetBox.width * x / 100;
      var targetCenterY = rangeBox.bottom - (targetBox.top + targetBox.height * y / 100);
      axeMark.style.setProperty("--land-x", targetCenterX / rangeBox.width * 100 + "%");
      axeMark.style.setProperty("--land-y", targetCenterY / rangeBox.height * 100 + "%");
      axeMark.classList.remove("dragging", "throwing"); void axeMark.offsetWidth; axeMark.classList.add("throwing");
      axeTarget.classList.remove("hit"); void axeTarget.offsetWidth; axeTarget.classList.add("hit");
      document.getElementById("axeThrows").textContent = axeThrows;
      document.getElementById("axeScore").textContent = axeScore;
      axeStatus.textContent = points === 10 ? "Bullseye! Strong release." : points + " points. Let it out and throw again.";
      setTimeout(function() { axeMark.classList.remove("throwing"); }, 1250);
    }
    axeMark.addEventListener("pointerdown", function(event) {
      axeStart = { x: event.clientX, y: event.clientY, time: Date.now(), pointerId: event.pointerId };
      axeMark.classList.add("dragging"); axeMark.setPointerCapture(event.pointerId);
      axeStatus.textContent = "Aim toward the target, then swipe upward.";
    });
    axeMark.addEventListener("pointermove", function(event) {
      if (!axeStart || axeMark.classList.contains("throwing")) return;
      if (axeStart.y - event.clientY < 90) return;
      var start = axeStart; axeStart = null;
      throwAxe(start.x, start.y, event.clientX, event.clientY, Date.now() - start.time);
    });
    function finishAxeSwipe(event) {
      if (!axeStart) return;
      throwAxe(axeStart.x, axeStart.y, event.clientX, event.clientY, Date.now() - axeStart.time);
      axeStart = null; axeMark.classList.remove("dragging");
    }
    axeMark.addEventListener("pointerup", finishAxeSwipe);
    axeRange.addEventListener("pointerup", finishAxeSwipe);
    window.addEventListener("pointerup", finishAxeSwipe);
    axeMark.addEventListener("pointercancel", function() { axeStart = null; axeMark.classList.remove("dragging"); });
    function resetAxeGame() {
      axeThrows = 0; axeScore = 0;
      document.getElementById("axeThrows").textContent = "0";
      document.getElementById("axeScore").textContent = "0";
      axeMark.classList.remove("dragging", "throwing");
      axeStatus.textContent = "Score cleared. Stand back, aim, and swipe upward.";
    }

    var plateLane = document.getElementById("plateLane");
    var throwPlate = document.getElementById("throwPlate");
    var plateStatus = document.getElementById("plateStatus");
    var plateStart = null;
    var plateSmashes = 0;
    function smashPlate(endX, endY) {
      var lane = plateLane.getBoundingClientRect();
      var landX = Math.max(18, Math.min(82, (endX - lane.left) / lane.width * 100));
      throwPlate.style.setProperty("--plate-x", landX + "%");
      throwPlate.classList.remove("dragging", "flying", "smashed"); void throwPlate.offsetWidth; throwPlate.classList.add("flying");
      setTimeout(function() {
        throwPlate.classList.add("smashed");
        for (var i = 0; i < 12; i += 1) {
          let shard = document.createElement("span"); shard.className = "plate-shard";
          shard.style.left = landX + "%"; shard.style.top = "34%";
          shard.style.setProperty("--dx", (-95 + Math.random() * 190) + "px");
          shard.style.setProperty("--dy", (75 + Math.random() * 160) + "px");
          shard.style.setProperty("--spin", (-360 + Math.random() * 720) + "deg");
          plateLane.appendChild(shard); setTimeout(function() { shard.remove(); }, 1900);
        }
        plateSmashes += 1; document.getElementById("plateSmashes").textContent = plateSmashes;
        plateStatus.textContent = "SMASH! Released safely. Grab the next virtual plate.";
        setTimeout(function() { throwPlate.classList.remove("flying", "smashed"); }, 1750);
      }, 560);
    }
    throwPlate.addEventListener("pointerdown", function(event) {
      plateStart = { x:event.clientX, y:event.clientY, time:Date.now() };
      throwPlate.classList.add("dragging"); throwPlate.setPointerCapture(event.pointerId);
      plateStatus.textContent = "Aim at the wall and swipe upward.";
    });
    throwPlate.addEventListener("pointermove", function(event) {
      if (!plateStart || throwPlate.classList.contains("flying")) return;
      if (plateStart.y - event.clientY < 85) return;
      plateStart = null; smashPlate(event.clientX, event.clientY);
    });
    function finishPlateSwipe(event) {
      if (!plateStart) return;
      if (plateStart.y - event.clientY >= 65) smashPlate(event.clientX, event.clientY);
      else plateStatus.textContent = "Swipe upward faster to throw the plate.";
      plateStart = null; throwPlate.classList.remove("dragging");
    }
    throwPlate.addEventListener("pointerup", finishPlateSwipe);
    plateLane.addEventListener("pointerup", finishPlateSwipe);
    window.addEventListener("pointerup", finishPlateSwipe);
    throwPlate.addEventListener("pointercancel", function() { plateStart = null; throwPlate.classList.remove("dragging"); });
    function resetPlateGame() {
      plateSmashes = 0; document.getElementById("plateSmashes").textContent = "0";
      throwPlate.classList.remove("dragging", "flying", "smashed");
      document.querySelectorAll(".plate-shard").forEach(function(shard) { shard.remove(); });
      plateStatus.textContent = "Fresh stack ready. Hold the plate and swipe upward.";
    }

    var crumpleNote = document.getElementById("crumpleNote");
    var paperBall = document.getElementById("paperBall");
    var crumpleDesk = document.getElementById("crumpleDesk");
    var crumpleStatus = document.getElementById("crumpleStatus");
    var crumpleStart = null;
    var releasedPapers = 0;
    function crumplePaper() {
      if (!crumpleNote.value.trim()) { crumpleStatus.textContent = "Write something you want to release first."; crumpleNote.focus(); return; }
      crumpleNote.classList.remove("crumpling"); void crumpleNote.offsetWidth; crumpleNote.classList.add("crumpling");
      crumpleStatus.textContent = "Crumpling it up...";
      setTimeout(function() { paperBall.classList.add("ready"); crumpleStatus.textContent = "Now swipe the paper ball upward into the release bin."; }, 520);
    }
    function releasePaper(endX) {
      var desk = crumpleDesk.getBoundingClientRect();
      var landX = Math.max(38, Math.min(62, (endX - desk.left) / desk.width * 100));
      paperBall.style.setProperty("--paper-x", landX + "%");
      paperBall.classList.remove("ready", "flying"); void paperBall.offsetWidth; paperBall.classList.add("flying");
      setTimeout(function() {
        releasedPapers += 1; document.getElementById("crumpleCount").textContent = releasedPapers;
        crumpleNote.value = ""; crumpleNote.classList.remove("crumpling"); paperBall.classList.remove("flying", "ready");
        crumpleStatus.textContent = "Released. Take one slow breath.";
      }, 650);
    }
    paperBall.addEventListener("pointerdown", function(event) {
      if (!paperBall.classList.contains("ready")) return;
      crumpleStart = { y:event.clientY };
      try { paperBall.setPointerCapture(event.pointerId); } catch (error) {}
      crumpleStatus.textContent = "Swipe upward toward the bin, or tap the paper ball to throw.";
    });
    function moveCrumpleSwipe(event) {
      if (!crumpleStart || crumpleStart.y - event.clientY < 55) return;
      crumpleStart = null; releasePaper(event.clientX);
    }
    function finishCrumpleSwipe(event) {
      if (!crumpleStart) return;
      if (crumpleStart.y - event.clientY >= 45) releasePaper(event.clientX);
      else crumpleStatus.textContent = "Swipe upward again, or tap the paper ball to throw.";
      crumpleStart = null;
    }
    paperBall.addEventListener("pointermove", moveCrumpleSwipe);
    crumpleDesk.addEventListener("pointermove", moveCrumpleSwipe);
    window.addEventListener("pointermove", moveCrumpleSwipe);
    paperBall.addEventListener("pointerup", finishCrumpleSwipe);
    crumpleDesk.addEventListener("pointerup", finishCrumpleSwipe);
    window.addEventListener("pointerup", finishCrumpleSwipe);
    paperBall.addEventListener("click", function(event) {
      if (paperBall.classList.contains("ready") && !crumpleStart) releasePaper(event.clientX || crumpleDesk.getBoundingClientRect().left + crumpleDesk.offsetWidth / 2);
    });
    paperBall.addEventListener("keydown", function(event) {
      if ((event.key === "Enter" || event.key === " ") && paperBall.classList.contains("ready")) {
        event.preventDefault(); releasePaper(crumpleDesk.getBoundingClientRect().left + crumpleDesk.offsetWidth / 2);
      }
    });
    paperBall.addEventListener("pointercancel", function() { crumpleStart = null; });
    function newCrumpleNote() {
      crumpleNote.value = ""; crumpleNote.classList.remove("crumpling"); paperBall.classList.remove("ready", "flying");
      crumpleStatus.textContent = "Fresh paper ready."; crumpleNote.focus();
    }

    var thinkingStage = document.getElementById("thinkingStage");
    var thinkingTool = document.getElementById("thinkingTool");
    var thinkingToolTitle = document.getElementById("thinkingToolTitle");
    var thinkingToolBody = document.getElementById("thinkingToolBody");
    var thinkingTimer;
    var thinkingQuestionIndex = 0;
    var thinkingQuestions = ["What do I really want?","What is holding me back?","What can I control?","What can I let go of?","What is the next small step?"];

    function closeThinkingTool(){ thinkingTool.classList.remove("open"); thinkingToolBody.innerHTML=""; clearInterval(thinkingTimer); }
    function thinkButton(label,action,kind){ return '<button type="button" class="'+(kind||"")+'" data-mr-action="'+action+'">'+label+'</button>'; }
    function openThinkingTool(tool){
      clearInterval(thinkingTimer); thinkingTool.classList.add("open"); var title="",body="";
      if(tool==="clear"){
        title="Clear My Head"; body='<p>Quiet the noise. Release the stress. Let your mind slow down.</p><div class="hourglass-visual" id="clearHeadVisual" aria-label="Working sand hourglass"><span class="hourglass-top-sand"></span><span class="hourglass-stream"></span><span class="hourglass-bottom-sand"></span></div><p id="clearHeadWords">Tap Start and follow one slow breath at a time.</p><div class="thinking-actions">'+thinkButton("START 2-MINUTE RESET","startClearHead()","primary")+thinkButton("I FEEL CLEARER","finishClearHead()")+'</div>';
      }else if(tool==="decide"){
        title="Help Me Decide"; body='<p>This room helps you hear yourself. It does not decide for you.</p><div class="thinking-fields"><input id="decisionA" placeholder="Option A"><input id="decisionB" placeholder="Option B"><input id="decisionOther" placeholder="Other possibility"><textarea id="decisionNotes" placeholder="What do I gain? What worries me? What matters most? What can wait?"></textarea></div><div class="thinking-actions">'+thinkButton("SAVE MY DECISION BOARD","saveDecisionBoard()","primary")+thinkButton("CLEAR BOARD","clearDecisionBoard()","danger")+'</div><p class="thinking-status" id="thinkingToolStatus"></p>';
      }else if(tool==="write"){
        title="Write It Out"; body='<p>Put your thoughts on paper. Get them out of your head and onto the page.</p><textarea id="thinkingWriting" placeholder="Write whatever is on your mind..."></textarea><div class="thinking-actions">'+thinkButton("SAVE PRIVATELY","saveThinkingWriting()","primary")+thinkButton("RELEASE & CLEAR","clearThinkingWriting()","danger")+'</div><p class="thinking-status" id="thinkingToolStatus"></p>';
      }else if(tool==="questions"){
        title="Ask Myself Questions"; body='<p class="thinking-question" id="thinkingQuestion">'+thinkingQuestions[thinkingQuestionIndex]+'</p><textarea id="thinkingAnswer" placeholder="Your answer..."></textarea><div class="thinking-actions">'+thinkButton("SAVE ANSWER & NEXT","saveThinkingAnswer()","primary")+thinkButton("NEXT QUESTION","nextThinkingQuestion()")+'</div><p class="thinking-status" id="thinkingToolStatus"></p>';
      }else if(tool==="brainstorm"){
        title="Brainstorm"; body='<p>Let ideas flow. Choose the pin you want, then add your idea.</p><input id="brainstormInput" placeholder="New idea"><div class="thinking-pin-picker" aria-label="Choose a pin color"><button type="button" class="pin-choice active" data-pin="#b83d35" data-mr-action="chooseThinkingPin(this)">RED PIN</button><button type="button" class="pin-choice" data-pin="#d49a28" data-mr-action="chooseThinkingPin(this)">GOLD PIN</button><button type="button" class="pin-choice" data-pin="#497c91" data-mr-action="chooseThinkingPin(this)">BLUE PIN</button><button type="button" class="pin-choice" data-pin="#63834a" data-mr-action="chooseThinkingPin(this)">GREEN PIN</button><button type="button" class="pin-choice" data-pin="#785684" data-mr-action="chooseThinkingPin(this)">PURPLE PIN</button></div><div class="thinking-actions">'+thinkButton("ADD IDEA","addBrainstormIdea()","primary")+thinkButton("CLEAR IDEAS","clearBrainstormIdeas()","danger")+'</div><div class="thinking-note-grid" id="brainstormGrid"></div><p class="thinking-status" id="thinkingToolStatus"></p>';
      }else if(tool==="quiet"){
        title="Just Think"; body='<p>No prompts. No pressure. Just you and your thoughts.</p><div class="hourglass-visual" id="quietVisual" aria-label="Working sand hourglass"><span class="hourglass-top-sand"></span><span class="hourglass-stream"></span><span class="hourglass-bottom-sand"></span></div><p id="quietWords">Choose a quiet pause.</p><div class="thinking-actions">'+thinkButton("1 MINUTE","startQuiet(60)","primary")+thinkButton("3 MINUTES","startQuiet(180)")+thinkButton("END QUIET TIME","finishQuiet()")+'</div>';
      }else if(tool==="hourglass"){
        title="Water Hourglass"; body='<p>Use the hourglass for calming prompts and reflection.</p><div class="hourglass-visual" id="hourglassVisual" aria-label="Working sand hourglass"><span class="hourglass-top-sand"></span><span class="hourglass-stream"></span><span class="hourglass-bottom-sand"></span></div><p id="hourglassWords">Ready when you are.</p><div class="thinking-actions">'+thinkButton("START HOURGLASS","startHourglass()","primary")+thinkButton("STOP","stopHourglass()")+'</div>';
      }else if(tool==="ambience"){
        title="Set Your Space"; body='<p>Choose an atmosphere from the pictured room controls.</p><div class="thinking-actions">'+thinkButton("SUNSHINE","setThinkingAmbience(\'warm\')","primary")+thinkButton("RAIN","setThinkingAmbience(\'rain\')")+thinkButton("NIGHT","setThinkingAmbience(\'night\')")+thinkButton("NATURAL","setThinkingAmbience(\'natural\')")+thinkButton("STILL MODE","toggleStillMode()")+'</div><p class="thinking-status" id="thinkingToolStatus"></p>';
      }else if(tool==="navigation"){
        title="Thinking Room Navigation"; body='<div class="thinking-actions">'+thinkButton("BACK TO GREAT ROOM","showScreen(\'great\');closeThinkingTool()","primary")+thinkButton("MELTDOWN ROOM","showScreen(\'meltdown\');closeThinkingTool()")+thinkButton("RANT ROOM","showScreen(\'rant\');closeThinkingTool()")+thinkButton("PROPERTY MAP","showScreen(\'map\');closeThinkingTool()")+thinkButton("HOME","showScreen(\'home\');closeThinkingTool()")+'</div>';
      }
      thinkingToolTitle.textContent=title; thinkingToolBody.innerHTML=body;
      if(tool==="decide")loadDecisionBoard(); if(tool==="write")document.getElementById("thinkingWriting").value=localStorage.getItem("thinkingPrivateWriting")||""; if(tool==="brainstorm")renderBrainstormIdeas();
    }
    function thinkingStatus(message){var el=document.getElementById("thinkingToolStatus");if(el)el.textContent=message;}
    function startClearHead(){var v=document.getElementById("clearHeadVisual"),w=document.getElementById("clearHeadWords");v.style.setProperty("--sand-time","120s");v.classList.remove("running");void v.offsetWidth;v.classList.add("running");var inhale=true,remaining=120;w.textContent="Breathe in slowly…";clearInterval(thinkingTimer);thinkingTimer=setInterval(function(){remaining--;if(remaining<=0){finishClearHead();return;}if(remaining%4===0){inhale=!inhale;w.textContent=(inhale?"Breathe in slowly…":"Breathe out gently…")+" "+remaining+" seconds";}},1000);}
    function finishClearHead(){clearInterval(thinkingTimer);var v=document.getElementById("clearHeadVisual");if(v)v.classList.remove("running");var w=document.getElementById("clearHeadWords");if(w)w.textContent="Take your time. Notice what feels a little lighter.";}
    function getDecision(){try{return JSON.parse(localStorage.getItem("thinkingDecisionBoard")||"{}");}catch(e){return {};}}
    function loadDecisionBoard(){var d=getDecision(),a=document.getElementById("decisionA"),b=document.getElementById("decisionB"),other=document.getElementById("decisionOther"),notes=document.getElementById("decisionNotes");if(!a||!b||!other||!notes)return;a.value=d.a||"";b.value=d.b||"";other.value=d.other||"";notes.value=d.notes||"";}
    function saveDecisionBoard(){var a=document.getElementById("decisionA"),b=document.getElementById("decisionB"),other=document.getElementById("decisionOther"),notes=document.getElementById("decisionNotes");if(!a||!b||!other||!notes)return;if(!a.value.trim()&&!b.value.trim()&&!other.value.trim()&&!notes.value.trim()){thinkingStatus("Add an option or a note before saving.");return;}localStorage.setItem("thinkingDecisionBoard",JSON.stringify({a:a.value,b:b.value,other:other.value,notes:notes.value}));thinkingStatus("Decision Board saved privately on this device.");}
    function clearDecisionBoard(){var a=document.getElementById("decisionA"),b=document.getElementById("decisionB"),other=document.getElementById("decisionOther"),notes=document.getElementById("decisionNotes");if(!a||!b||!other||!notes)return;if(!a.value.trim()&&!b.value.trim()&&!other.value.trim()&&!notes.value.trim()&&!localStorage.getItem("thinkingDecisionBoard")){thinkingStatus("The Decision Board is already clear.");return;}if(!window.confirm("Clear the entire Decision Board from this device?"))return;localStorage.removeItem("thinkingDecisionBoard");a.value=b.value=other.value=notes.value="";thinkingStatus("Decision Board cleared.");}
    function saveThinkingWriting(){var writing=document.getElementById("thinkingWriting");if(!writing||!writing.value.trim()){thinkingStatus("Write something first—this page is yours.");return;}localStorage.setItem("thinkingPrivateWriting",writing.value);thinkingStatus("Writing saved privately on this device.");}
    function clearThinkingWriting(){var writing=document.getElementById("thinkingWriting");if(!writing||!writing.value.trim()){thinkingStatus("There is nothing to release yet.");return;}if(!window.confirm("Release and permanently clear this private writing?"))return;writing.value="";localStorage.removeItem("thinkingPrivateWriting");thinkingStatus("Released. The page is clear.");}
    function nextThinkingQuestion(){var question=document.getElementById("thinkingQuestion"),answer=document.getElementById("thinkingAnswer");thinkingQuestionIndex=(thinkingQuestionIndex+1)%thinkingQuestions.length;if(question)question.textContent=thinkingQuestions[thinkingQuestionIndex];if(answer)answer.value="";}
    function saveThinkingAnswer(){var answer=document.getElementById("thinkingAnswer");if(!answer||!answer.value.trim()){thinkingStatus("Write your answer first, or choose Next Question.");return;}var answers=[];try{answers=JSON.parse(localStorage.getItem("thinkingAnswers")||"[]");}catch(e){}answers.push({question:thinkingQuestions[thinkingQuestionIndex],answer:answer.value.trim(),date:new Date().toISOString()});localStorage.setItem("thinkingAnswers",JSON.stringify(answers.slice(-100)));thinkingStatus("Answer saved privately.");nextThinkingQuestion();}
    var selectedThinkingPin="#b83d35";
    function chooseThinkingPin(button){selectedThinkingPin=button.getAttribute("data-pin")||"#b83d35";document.querySelectorAll(".pin-choice").forEach(function(pin){pin.classList.remove("active");});button.classList.add("active");thinkingStatus("Pin selected.");}
    function getBrainstormIdeas(){try{var list=JSON.parse(localStorage.getItem("thinkingBrainstormIdeas")||"[]");return Array.isArray(list)?list.map(function(item){return typeof item==="string"?{text:item,pin:"#b83d35"}:item;}):[];}catch(e){return [];}}
    function renderBrainstormIdeas(){var g=document.getElementById("brainstormGrid");if(!g)return;var ideas=getBrainstormIdeas();g.innerHTML=ideas.length?ideas.map(function(item,i){var text=(item.text||"").replace(/[&<>"]/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch];});return '<button type="button" class="thinking-note-card" style="--pin:'+String(item.pin||"#b83d35").replace(/[^#a-zA-Z0-9(),.% -]/g,"")+'" data-mr-action="removeBrainstormIdea('+i+')" aria-label="Remove idea">'+text+'</button>';}).join(""):"<p>Your board is ready for ideas.</p>";}
    function addBrainstormIdea(){var input=document.getElementById("brainstormInput");if(!input||!input.value.trim()){thinkingStatus("Write an idea first.");return;}var ideas=getBrainstormIdeas();ideas.push({text:input.value.trim(),pin:selectedThinkingPin});localStorage.setItem("thinkingBrainstormIdeas",JSON.stringify(ideas));input.value="";renderBrainstormIdeas();thinkingStatus("Idea added with your chosen pin. Tap an idea to remove it.");}
    function removeBrainstormIdea(i){var ideas=getBrainstormIdeas();ideas.splice(i,1);localStorage.setItem("thinkingBrainstormIdeas",JSON.stringify(ideas));renderBrainstormIdeas();}
    function clearBrainstormIdeas(){if(!getBrainstormIdeas().length){thinkingStatus("The Brainstorm Board is already clear.");return;}if(!window.confirm("Clear every idea from the Brainstorm Board?"))return;localStorage.removeItem("thinkingBrainstormIdeas");renderBrainstormIdeas();thinkingStatus("Brainstorm Board cleared.");}
    function startQuiet(seconds){var v=document.getElementById("quietVisual"),w=document.getElementById("quietWords"),remaining=seconds;v.style.setProperty("--sand-time",seconds+"s");v.classList.remove("running");void v.offsetWidth;v.classList.add("running");w.textContent="Quiet time: "+remaining+" seconds";clearInterval(thinkingTimer);thinkingTimer=setInterval(function(){remaining--;w.textContent=remaining>0?"Quiet time: "+remaining+" seconds":"Quiet time complete. Take your next step gently.";if(remaining<=0){clearInterval(thinkingTimer);v.classList.remove("running");}},1000);}
    function finishQuiet(){clearInterval(thinkingTimer);var v=document.getElementById("quietVisual");if(v)v.classList.remove("running");var w=document.getElementById("quietWords");if(w)w.textContent="Quiet time ended. Keep what helped.";}
    function startHourglass(){var v=document.getElementById("hourglassVisual"),w=document.getElementById("hourglassWords"),prompts=["What do I really want?","What can I control?","What can I let go of?","What is one small next step?"],remaining=60;v.style.setProperty("--sand-time","60s");v.classList.remove("running");void v.offsetWidth;v.classList.add("running");w.textContent=prompts[0]+" 60 seconds";clearInterval(thinkingTimer);thinkingTimer=setInterval(function(){remaining--;if(remaining<=0){clearInterval(thinkingTimer);v.classList.remove("running");w.textContent="Hourglass complete. Keep the thought that helped.";return;}var index=Math.min(prompts.length-1,Math.floor((60-remaining)/15));w.textContent=prompts[index]+" "+remaining+" seconds";},1000);}
    function stopHourglass(){clearInterval(thinkingTimer);var v=document.getElementById("hourglassVisual");if(v)v.classList.remove("running");var w=document.getElementById("hourglassWords");if(w)w.textContent="Hourglass paused. Take your time.";}
    function setThinkingAmbience(mode){thinkingStage.classList.remove("thinking-rain","thinking-night","thinking-warm");if(mode!=="natural")thinkingStage.classList.add("thinking-"+mode);localStorage.setItem("thinkingAmbience",mode);thinkingStatus("Atmosphere set to "+mode+".");}
    var savedThinkingAmbience=localStorage.getItem("thinkingAmbience")||"natural";if(savedThinkingAmbience!=="natural")thinkingStage.classList.add("thinking-"+savedThinkingAmbience);



    var calmStage=document.getElementById("calmStage"),calmBreathOrb=document.getElementById("calmBreathOrb"),calmStatus=document.getElementById("calmStatus"),calmTimer=null,calmAudioContext=null,calmSoundNodes=[];
    function stopCalmTimer(){clearInterval(calmTimer);calmTimer=null;}
    function startCalmBreathing(){
      stopCalmTimer();calmStage.classList.add("breathing");calmBreathOrb.classList.add("active");
      var inhale=true,cycles=0;calmBreathOrb.textContent="BREATHE IN";calmStatus.textContent="Breathe in slowly as the light expands.";
      calmTimer=setInterval(function(){inhale=!inhale;if(!inhale)cycles++;calmBreathOrb.textContent=inhale?"BREATHE IN":"BREATHE OUT";calmStatus.textContent=inhale?"Breathe in slowly.":"Let the breath out gently.";if(cycles>=4){stopCalmTimer();calmStage.classList.remove("breathing");calmBreathOrb.classList.remove("active");calmStatus.textContent="Four calm breaths complete. Stay here as long as you need."; }},4000);
    }
    function startCalmQuiet(seconds){
      stopCalmTimer();calmStage.classList.remove("breathing");calmBreathOrb.classList.remove("active");var remaining=seconds;calmStatus.textContent="Quiet time: "+remaining+" seconds.";
      calmTimer=setInterval(function(){remaining--;calmStatus.textContent=remaining>0?"Quiet time: "+remaining+" seconds.":"Quiet minute complete. Notice how you feel now.";if(remaining<=0)stopCalmTimer();},1000);
    }
    function stopCalmSound(){
      calmSoundNodes.forEach(function(node){try{node.stop?node.stop():node.disconnect();}catch(error){}});calmSoundNodes=[];
      document.getElementById("calmSoundWave").classList.remove("active");
    }
    function makeCalmNoise(context,seconds,amount){
      var length=context.sampleRate*seconds,buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0),last=0;
      for(var i=0;i<length;i++){var white=Math.random()*2-1;last=last*.985+white*.015;data[i]=(white*.22+last*.78)*amount;}
      return buffer;
    }
    function addCricketChirps(context){
      var master=context.createGain();master.gain.value=.13;master.connect(context.destination);calmSoundNodes.push(master);
      var start=context.currentTime+.12;
      for(var group=0;group<18;group++){
        var groupStart=start+group*(1.35+Math.random()*.85);
        for(var chirp=0;chirp<3;chirp++){
          var oscillator=context.createOscillator(),gain=context.createGain(),when=groupStart+chirp*.105;
          oscillator.type="sine";oscillator.frequency.setValueAtTime(3900+Math.random()*900,when);
          oscillator.frequency.exponentialRampToValueAtTime(2850+Math.random()*550,when+.055);
          gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(.38,when+.009);gain.gain.exponentialRampToValueAtTime(.0001,when+.075);
          oscillator.connect(gain);gain.connect(master);oscillator.start(when);oscillator.stop(when+.085);calmSoundNodes.push(oscillator,gain);
        }
      }
    }
    function setCalmSound(mode){
      stopCalmSound();if(mode==="off"){stopCalmTimer();calmStage.classList.remove("breathing");calmBreathOrb.classList.remove("active");calmStatus.textContent="The room is quiet.";return;}
      try{
        calmAudioContext=calmAudioContext||new (window.AudioContext||window.webkitAudioContext)();
        if(calmAudioContext.state==="suspended")calmAudioContext.resume();
        var source=calmAudioContext.createBufferSource(),filter=calmAudioContext.createBiquadFilter(),gain=calmAudioContext.createGain();
        source.buffer=makeCalmNoise(calmAudioContext,4,mode==="rain"?1:.72);source.loop=true;filter.type=mode==="rain"?"lowpass":"bandpass";filter.frequency.value=mode==="rain"?1800:720;filter.Q.value=mode==="rain"?.4:.75;gain.gain.value=mode==="rain"?.27:.34;
        source.connect(filter);filter.connect(gain);gain.connect(calmAudioContext.destination);source.start();calmSoundNodes=[source,filter,gain];
        if(mode==="stream")addCricketChirps(calmAudioContext);
        document.getElementById("calmSoundWave").classList.add("active");calmStatus.textContent=mode==="rain"?"Gentle rain is playing. Turn up your phone volume if needed.":"The stream and nighttime crickets are playing. Turn up your phone volume if needed.";
      }catch(error){calmStatus.textContent="Sound is unavailable. Check that your phone is not muted, then tap again.";}
    }
    function openCalmReflection(){document.getElementById("calmReflection").classList.add("open");document.getElementById("calmReflectionText").value=localStorage.getItem("calmRoomReflection")||"";document.getElementById("calmReflectionText").focus();calmStatus.textContent="This reflection stays privately on this device.";}
    function closeCalmReflection(){document.getElementById("calmReflection").classList.remove("open");}
    function saveCalmReflection(){localStorage.setItem("calmRoomReflection",document.getElementById("calmReflectionText").value);calmStatus.textContent="Reflection saved privately on this device.";}
    function clearCalmReflection(){var field=document.getElementById("calmReflectionText");if(!field.value.trim()&&!localStorage.getItem("calmRoomReflection")){calmStatus.textContent="The reflection page is already clear.";return;}if(!window.confirm("Clear this private Calm Room reflection?"))return;field.value="";localStorage.removeItem("calmRoomReflection");calmStatus.textContent="Reflection cleared.";}


    var hopeWorkspace=document.getElementById("hopeWorkspace"),hopeStatus=document.getElementById("hopeStatus"),hopeQuietTimer=null;
    var hopeMessages=["You do not have to have it all figured out.","Small steps still move you forward.","Better days can begin with tiny moments.","You are enough, exactly as you are.","You have survived hard days before.","Resting is not giving up.","Hope can be quiet and still be real."];
    function hopeEscape(text){return String(text).replace(/[&<>"]/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch];});}
    function getHopeNotes(){try{return JSON.parse(localStorage.getItem("hopeRoomNotes")||"[]");}catch(error){return [];}}
    function closeHopeTool(){hopeWorkspace.classList.remove("open");hopeWorkspace.innerHTML="";}
    function openHopeTool(tool){
      clearInterval(hopeQuietTimer);hopeWorkspace.classList.add("open");
      if(tool==="box"){var notes=getHopeNotes(),message=notes.length?notes[Math.floor(Math.random()*notes.length)].text:hopeMessages[Math.floor(Math.random()*hopeMessages.length)];hopeWorkspace.innerHTML='<h3>A Note From Your Hope Box</h3><div class="hope-note">'+hopeEscape(message)+'</div><div class="tool-actions"><button type="button" data-mr-action="openHopeTool(\'box\')">ANOTHER NOTE</button><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent="Keep this note with you for today.";}
      else if(tool==="write"){hopeWorkspace.innerHTML='<h3>Leave Myself a Hope Note</h3><textarea id="hopeNoteText" placeholder="What do you want your future self to remember?"></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="saveHopeNote()">SAVE PRIVATELY</button><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent="This note stays privately on this device.";document.getElementById("hopeNoteText").focus();}
      else if(tool==="send"){hopeWorkspace.innerHTML='<h3>Send Hope to Someone</h3><textarea id="hopeShareText" placeholder="Write a kind note of hope or encouragement..."></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="shareHopeNote()">OPEN PHONE SHARE MENU</button><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent="You choose who receives it. Nothing is sent automatically.";}
      else if(tool==="past"){renderPastHopeNotes();}
      else if(tool==="plant"){renderHopePlant();}
      else if(tool==="sit"){hopeWorkspace.innerHTML='<h3>Sit With Hope</h3><p id="hopeQuietWords">One quiet minute. Breathe normally. Nothing to solve right now.</p><div class="tool-actions"><button class="primary" type="button" data-mr-action="startHopeQuiet()">START ONE MINUTE</button><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent="Sit back. Let the room hold the moment.";}
    }
    function saveHopeNote(){var input=document.getElementById("hopeNoteText");if(!input.value.trim()){hopeStatus.textContent="Write a hope note first.";return;}var notes=getHopeNotes();notes.unshift({text:input.value.trim(),date:new Date().toISOString()});localStorage.setItem("hopeRoomNotes",JSON.stringify(notes.slice(0,50)));input.value="";hopeStatus.textContent="Hope note saved privately in your Hope Box.";}
    function renderPastHopeNotes(){var notes=getHopeNotes();hopeWorkspace.innerHTML='<h3>My Past Hope Notes</h3><div class="hope-notes">'+(notes.length?notes.map(function(note){return '<div class="hope-note">'+hopeEscape(note.text)+'<br><small>'+new Date(note.date).toLocaleDateString()+'</small></div>';}).join(""):'<p>Your first hope note will appear here.</p>')+'</div><div class="tool-actions"><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent=notes.length?"Look how much hope you have carried.":"Your Hope Box is ready for its first note.";}
    async function shareHopeNote(){var input=document.getElementById("hopeShareText"),text=input.value.trim();if(!text){hopeStatus.textContent="Write a note of hope first.";return;}if(navigator.share){try{await navigator.share({title:"A Note of Hope",text:text});hopeStatus.textContent="Your phone share menu handled the note.";return;}catch(error){if(error.name==="AbortError"){hopeStatus.textContent="Sharing canceled.";return;}}}try{await navigator.clipboard.writeText(text);hopeStatus.textContent="Hope note copied. Paste it wherever you choose.";}catch(error){hopeStatus.textContent="Select and copy your note to share it.";}}
    function renderHopePlant(){var stage=Math.max(0,Math.min(3,Number(localStorage.getItem("hopePlantStage")||0)));hopeWorkspace.innerHTML='<h3>Plant a Hope</h3><div class="hope-plant stage-'+stage+'" id="hopePlant"><div class="hope-stem"></div><span class="hope-leaf leaf-1"></span><span class="hope-leaf leaf-2"></span><span class="hope-leaf leaf-3"></span><span class="hope-leaf leaf-4"></span><span class="hope-flower"></span><span class="hope-pot"></span></div><p id="hopePlantWords">'+(stage===0?"A seed is waiting.":stage===1?"Your hope has sprouted.":stage===2?"Your hope is growing stronger.":"Your hope is blooming.")+'</p><div class="tool-actions"><button class="primary" type="button" data-mr-action="growHopePlant()">NURTURE MY HOPE</button><button type="button" data-mr-action="resetHopePlant()">PLANT NEW SEED</button><button type="button" data-mr-action="closeHopeTool()">CLOSE</button></div>';hopeStatus.textContent="Hope grows in small steps.";}
    function growHopePlant(){var stage=Math.min(3,Number(localStorage.getItem("hopePlantStage")||0)+1);localStorage.setItem("hopePlantStage",stage);renderHopePlant();hopeStatus.textContent=stage===3?"Your hope is blooming.":"Your hope grew a little today.";}
    function resetHopePlant(){if(!window.confirm("Plant a new seed and restart this Hope Plant?"))return;localStorage.setItem("hopePlantStage","0");renderHopePlant();hopeStatus.textContent="A new hope seed is planted.";}
    function startHopeQuiet(){var remaining=60,words=document.getElementById("hopeQuietWords");clearInterval(hopeQuietTimer);words.textContent="Quiet hope: "+remaining+" seconds.";hopeQuietTimer=setInterval(function(){remaining--;words.textContent=remaining>0?"Quiet hope: "+remaining+" seconds.":"One quiet minute complete. Hope can be small and still be real.";if(remaining<=0)clearInterval(hopeQuietTimer);},1000);}

    var celebrationWorkspace=document.getElementById("celebrationWorkspace"),celebrationStatus=document.getElementById("celebrationStatus");
    function celebrationEscape(value){var d=document.createElement("div");d.textContent=value;return d.innerHTML;}
    function celebrationRecords(){try{return JSON.parse(localStorage.getItem("celebrationRoomWins")||"[]");}catch(error){return [];}}
    function closeCelebrationTool(){celebrationWorkspace.classList.remove("open");celebrationWorkspace.innerHTML="";}
    function openCelebrationTool(tool){celebrationWorkspace.classList.add("open");
      if(tool==="private")celebrationWorkspace.innerHTML='<h3>Celebrate Privately</h3><textarea id="celebrationText" placeholder="Name your win. Big, small, or hard fought—it counts."></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="saveCelebration(\'Private win\')">SAVE PRIVATELY</button><button type="button" data-mr-action="showCelebrations()">MY CELEBRATIONS</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';
      else if(tool==="share")celebrationWorkspace.innerHTML='<h3>Share My Win</h3><textarea id="celebrationText" placeholder="What good news would you like to share?"></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="shareCelebration()">OPEN PHONE SHARE MENU</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';
      else if(tool==="milestone")celebrationWorkspace.innerHTML='<h3>Mark a Milestone</h3><input id="celebrationTitle" placeholder="Milestone name"><textarea id="celebrationText" placeholder="What made this moment important?"></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="saveCelebration(\'Milestone\')">ADD TO MY MILESTONE WALL</button><button type="button" data-mr-action="showCelebrations()">VIEW MY WALL</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';
      else if(tool==="someone")celebrationWorkspace.innerHTML='<h3>Celebrate Someone Else</h3><textarea id="celebrationText" placeholder="Tell them what you noticed and why it matters."></textarea><div class="tool-actions"><button class="primary" type="button" data-mr-action="shareCelebration()">OPEN PHONE SHARE MENU</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';
      else{celebrationWorkspace.innerHTML='<h3>My Happy Place</h3><div class="celebration-bloom">🌻 ✨ 🌼</div><p>Take three easy breaths. Let yourself feel the good without making it smaller.</p><div class="tool-actions"><button class="primary" type="button" data-mr-action="celebrationStatus.textContent=\'You made room for joy today.\'">I AM HERE</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';celebrationStatus.textContent="Come in, breathe deep, and soak in the good energy.";}}
    function saveCelebration(kind){var text=document.getElementById("celebrationText"),title=document.getElementById("celebrationTitle");if(!text||!text.value.trim()){celebrationStatus.textContent="Name the moment you want to celebrate first.";return;}var records=celebrationRecords();records.unshift({kind:kind,title:title&&title.value.trim(),text:text.value.trim(),date:new Date().toISOString()});localStorage.setItem("celebrationRoomWins",JSON.stringify(records.slice(0,75)));celebrationStatus.textContent="Saved privately. Your celebration made a flower bloom.";celebrationWorkspace.innerHTML='<div class="celebration-bloom">🌻</div><p>You did that. Be proud.</p><div class="tool-actions"><button type="button" data-mr-action="showCelebrations()">MY CELEBRATIONS</button><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';}
    function showCelebrations(){var records=celebrationRecords();celebrationWorkspace.classList.add("open");celebrationWorkspace.innerHTML='<h3>My Celebration Wall</h3><div class="celebration-history">'+(records.length?records.map(function(r){return '<div class="celebration-card"><strong>'+celebrationEscape(r.title||r.kind)+'</strong><br>'+celebrationEscape(r.text)+'<br><small>'+new Date(r.date).toLocaleDateString()+'</small></div>';}).join(""):'<p>Your first celebration will appear here.</p>')+'</div><div class="tool-actions"><button type="button" data-mr-action="closeCelebrationTool()">CLOSE</button></div>';}
    async function shareCelebration(){var input=document.getElementById("celebrationText"),value=input&&input.value.trim();if(!value){celebrationStatus.textContent="Write the celebration first.";return;}if(navigator.share){try{await navigator.share({title:"Something Worth Celebrating",text:value});celebrationStatus.textContent="Your phone share menu handled the celebration.";return;}catch(error){if(error.name==="AbortError"){celebrationStatus.textContent="Sharing canceled.";return;}}}try{await navigator.clipboard.writeText(value);celebrationStatus.textContent="Celebration copied. Share it wherever you choose.";}catch(error){celebrationStatus.textContent="Select and copy your message to share it.";}}

    var learnWorkspace=document.getElementById("learnWorkspace"),learnStatus=document.getElementById("learnStatus");
    var learnResources={
      "Autism & Neurodiversity":[
        {title:"Autistic Self Advocacy Network Resource Library",description:"Autistic-led guides about self-advocacy, communication, community living, healthcare, college, and transition to adulthood.",source:"ASAN",url:"https://autisticadvocacy.org/resources/"},
        {title:"Start Here: A Guide for Parents of Autistic Kids",description:"A strengths-based starting place created by autistic advocates for families learning how to support an autistic child.",source:"ASAN",url:"https://autisticadvocacy.org/book/start-here/"}
      ],
      "Parenting & Caregiving":[
        {title:"Positive Parenting Tips by Age",description:"Practical guidance for nurturing, protecting, and guiding children through each stage of development.",source:"CDC",url:"https://www.cdc.gov/child-development/positive-parenting-tips/index.html"},
        {title:"Helping Children Manage Big Feelings",description:"Simple emotion-coaching ideas that help children feel safe, understood, and supported during hard moments.",source:"American Academy of Pediatrics",url:"https://www.healthychildren.org/English/family-life/family-dynamics/Pages/helping-little-people-manage-big-feelings.aspx"}
      ],
      "Trauma Recovery & Healing":[
        {title:"Trauma-Informed Approaches and Programs",description:"Learn about safety, trust, peer support, collaboration, choice, and recovery-focused care.",source:"SAMHSA",url:"https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs"},
        {title:"Helping Children Cope After Trauma",description:"Supportive guidance built around reassurance, returning to routine, and regulation.",source:"American Academy of Pediatrics",url:"https://www.healthychildren.org/English/healthy-living/emotional-wellness/Building-Resilience/Pages/Childhood-Trauma-3-Ways-to-Help-Kids-Cope.aspx"}
      ],
      "Caregiver Support":[
        {title:"Government Resources for Caregivers",description:"A collection of caregiver information and services across U.S. health agencies.",source:"U.S. Department of Health and Human Services",url:"https://www.hhs.gov/programs/providers-and-facilities/resources-for-caregivers/index.html"},
        {title:"Find Caregiver Services in Your State",description:"Locate support, guidance, and service organizations for family caregivers.",source:"Family Caregiver Alliance",url:"https://www.caregiver.org/connecting-caregivers/services-by-state/"}
      ],
      "Emotional Wellness":[
        {title:"988 Suicide & Crisis Lifeline",description:"Free, confidential emotional support available 24/7 in the United States and its territories. Call or text 988 when immediate support is needed.",source:"988 Lifeline",url:"https://988lifeline.org/"},
        {title:"Find Support for Mental Health or Substance Use",description:"Official starting points for treatment, support, and help for yourself or someone you care about.",source:"SAMHSA",url:"https://www.samhsa.gov/find-support"}
      ],
      "School & Advocacy":[
        {title:"IDEA Resources for Parents and Families",description:"Understand special-education rights, IEP information, and federally supported family resources.",source:"U.S. Department of Education",url:"https://sites.ed.gov/idea/parents-families/"},
        {title:"Find Your Parent Training and Information Center",description:"Find the center serving your state for disability education information, training, and family support.",source:"U.S. Department of Education",url:"https://www.ed.gov/grants-and-programs/grants-special-populations/grants-special-education-and-individuals-disabilities/special-education-parent-information-centers"}
      ],
      "Daily Life Tips":[
        {title:"The Importance of Family Routines",description:"Ideas for creating regular, predictable routines while keeping enough flexibility for real family life.",source:"American Academy of Pediatrics",url:"https://www.healthychildren.org/English/family-life/family-dynamics/Pages/The-Importance-of-Family-Routines.aspx"},
        {title:"Tips for Building Structure",description:"Learn how routines, clear expectations, and consistent responses can make daily life more predictable.",source:"CDC",url:"https://www.cdc.gov/parenting-toddlers/structure-rules/structure.html"}
      ]
    };
    function learnEscape(v){var d=document.createElement("div");d.textContent=v;return d.innerHTML;}
    function openLearnShelf(name,button){
      document.querySelectorAll(".learn-shelf").forEach(function(b){b.classList.remove("active");});
      if(button)button.classList.add("active");
      localStorage.setItem("meltdownLearningShelf",name);
      var items=learnResources[name]||[];
      var notice=name==="Emotional Wellness"?'<p class="learn-notice"><strong>Need immediate help?</strong> In the U.S., call or text 988. If there is immediate danger, call emergency services.</p>':'';
      learnWorkspace.classList.add("open");
      learnWorkspace.innerHTML="<h3>"+learnEscape(name)+"</h3>"+notice+'<p class="learn-disclaimer">Trusted starting points for education and support. External resources open in a new tab and do not replace professional medical, mental-health, or legal advice.</p>'+items.map(function(item,i){
        return '<article class="learn-resource"><span class="learn-source">'+learnEscape(item.source)+'</span><strong>'+learnEscape(item.title)+'</strong><p>'+learnEscape(item.description)+'</p><div class="learn-resource-actions"><a class="learn-open" href="'+learnEscape(item.url)+'" target="_blank" rel="noopener noreferrer">OPEN RESOURCE</a><button data-mr-action="markLearned(\''+learnEscape(name).replace(/'/g,"&#39;")+'\','+i+',this)">MARK AS LEARNED</button></div></article>';
      }).join("")+'<button data-mr-action="closeLearnWorkspace()">CLOSE</button>';
      learnStatus.textContent=name+" shelf opened with "+items.length+" trusted resources.";
    }
    function markLearned(name,index,button){var key="meltdownLearned";var done=[];try{done=JSON.parse(localStorage.getItem(key)||"[]");}catch(e){}var id=name+"::"+index;if(!done.includes(id))done.push(id);localStorage.setItem(key,JSON.stringify(done));button.textContent="LEARNED ✓";button.disabled=true;learnStatus.textContent="Progress saved privately on this device.";}
    function continueLearning(){var name=localStorage.getItem("meltdownLearningShelf")||"Daily Life Tips";var button=Array.from(document.querySelectorAll(".learn-shelf")).find(function(b){return b.textContent.toLowerCase().includes(name.toLowerCase());});openLearnShelf(name,button);}
    var learnTemplates={
      schedule:{title:"Visual Schedule",intro:"Create a simple, predictable order for the day.",fields:[
        {key:"morning",label:"Morning steps",placeholder:"Wake up\nGet dressed\nBreakfast"},
        {key:"afternoon",label:"Afternoon steps",placeholder:"Lunch\nSchool or activity\nQuiet break"},
        {key:"evening",label:"Evening steps",placeholder:"Dinner\nPrepare for tomorrow\nBedtime routine"}
      ]},
      sensory:{title:"Sensory Checklist",intro:"Notice patterns without judgment. Record what helps and what feels difficult.",fields:[
        {key:"helps",label:"Things that help",placeholder:"Dim lights, headphones, heavy blanket..."},
        {key:"hard",label:"Things that feel difficult",placeholder:"Crowds, sudden noises, clothing textures..."},
        {key:"plan",label:"Support plan",placeholder:"What can we prepare, offer, or change?"}
      ]},
      calm:{title:"Calm Down Plan",intro:"Write the steps that help when feelings become too much.",fields:[
        {key:"signals",label:"Early signs I notice",placeholder:"My body, thoughts, or behavior..."},
        {key:"steps",label:"Steps that help",placeholder:"Move somewhere quiet\nBreathe slowly\nUse a comfort item"},
        {key:"support",label:"People or support I can ask for",placeholder:"Names, numbers, or a simple phrase to use"}
      ]},
      caregiver:{title:"Caregiver Planner",intro:"Keep today's priorities realistic and make space for your own needs.",fields:[
        {key:"today",label:"Today's important needs",placeholder:"Appointments, calls, school notes..."},
        {key:"help",label:"What I can ask someone else to help with",placeholder:"Meals, transportation, a short break..."},
        {key:"self",label:"One thing I need today",placeholder:"Rest, food, fresh air, connection..."}
      ]},
      progress:{title:"Progress Celebration Chart",intro:"Celebrate steady effort and meaningful progress without pressure.",fields:[
        {key:"goal",label:"What we are practicing",placeholder:"A clear, kind, achievable goal"},
        {key:"steps",label:"Small steps or check-in days",placeholder:"Step 1\nStep 2\nStep 3"},
        {key:"celebrate",label:"How we will celebrate progress",placeholder:"Praise, shared activity, favorite song..."}
      ]}
    };
    function openLearnTools(){
      learnWorkspace.classList.add("open");
      learnWorkspace.innerHTML='<h3>Tools & Printables</h3><p>Choose a tool. Fill it in, save it privately on this device, or print a clean copy.</p><div class="learn-tool-grid">'+
        Object.keys(learnTemplates).map(function(id){var t=learnTemplates[id];return '<button class="learn-tool-card" data-mr-action="openLearnTemplate(\''+id+'\')"><strong>'+learnEscape(t.title)+'</strong><span>'+learnEscape(t.intro)+'</span></button>';}).join("")+
        '</div><button data-mr-action="closeLearnWorkspace()">CLOSE</button>';
      learnStatus.textContent="Working tools and printables opened.";
    }
    function learnTemplateValues(id){try{return JSON.parse(localStorage.getItem("meltdownLearnTool::"+id)||"{}");}catch(e){return {};}}
    function openLearnTemplate(id){
      var t=learnTemplates[id];if(!t)return;
      var values=learnTemplateValues(id);
      learnWorkspace.classList.add("open");
      learnWorkspace.innerHTML='<div class="learn-print-sheet"><h3>'+learnEscape(t.title)+'</h3><p>'+learnEscape(t.intro)+'</p>'+
        t.fields.map(function(field){return '<label class="learn-template-field"><strong>'+learnEscape(field.label)+'</strong><textarea data-learn-field="'+learnEscape(field.key)+'" placeholder="'+learnEscape(field.placeholder)+'">'+learnEscape(values[field.key]||"")+'</textarea></label>';}).join("")+
        '<p class="learn-private-note">Saved information stays privately on this device.</p></div>'+
        '<div class="learn-template-actions"><button class="primary" data-mr-action="saveLearnTemplate(\''+id+'\')">SAVE PRIVATELY</button><button data-mr-action="printLearnTemplate()">PRINT</button><button data-mr-action="clearLearnTemplate(\''+id+'\')">CLEAR</button><button data-mr-action="openLearnTools()">BACK TO TOOLS</button><button data-mr-action="closeLearnWorkspace()">CLOSE</button></div>';
      learnStatus.textContent=t.title+" opened.";
    }
    function saveLearnTemplate(id){
      var values={};learnWorkspace.querySelectorAll("[data-learn-field]").forEach(function(field){values[field.getAttribute("data-learn-field")]=field.value;});
      localStorage.setItem("meltdownLearnTool::"+id,JSON.stringify(values));
      learnStatus.textContent="Saved privately on this device.";
    }
    function clearLearnTemplate(id){
      if(!window.confirm("Clear this saved tool from this device?"))return;
      localStorage.removeItem("meltdownLearnTool::"+id);
      openLearnTemplate(id);
      learnStatus.textContent="Tool cleared.";
    }
    function printLearnTemplate(){
      document.body.classList.add("printing-learn-tool");
      window.addEventListener("afterprint",function removePrintMode(){document.body.classList.remove("printing-learn-tool");window.removeEventListener("afterprint",removePrintMode);});
      window.print();
    }
    function askLearningQuestion(){learnWorkspace.classList.add("open");learnWorkspace.innerHTML='<h3>Ask. Learn. Grow.</h3><input id="learnQuestionTitle" placeholder="What topic is this about?"><textarea id="learnQuestionText" placeholder="What would you like help understanding?"></textarea><button class="primary" data-mr-action="saveLearningQuestion()">SAVE QUESTION PRIVATELY</button><button data-mr-action="closeLearnWorkspace()">CLOSE</button>';learnStatus.textContent="Write your question. It stays on this device.";}
    function saveLearningQuestion(){var title=document.getElementById("learnQuestionTitle").value.trim(),body=document.getElementById("learnQuestionText").value.trim();if(!body){learnStatus.textContent="Write your question first.";return;}var list=[];try{list=JSON.parse(localStorage.getItem("meltdownLearningQuestions")||"[]");}catch(e){}list.unshift({title:title,text:body,date:new Date().toISOString()});localStorage.setItem("meltdownLearningQuestions",JSON.stringify(list.slice(0,100)));learnStatus.textContent="Question saved privately on this device.";closeLearnWorkspace();}
    function closeLearnWorkspace(){learnWorkspace.classList.remove("open");learnWorkspace.innerHTML="";}


    var companionDraft={type:"Small Dog",mode:"Follows me",photo:"",petIndex:0};
    function companionSaved(){try{return JSON.parse(localStorage.getItem("meltdownCompanion")||"null");}catch(error){return null;}}
    function companionEscape(value){var node=document.createElement("div");node.textContent=value||"";return node.innerHTML;}
    function companionTypeLetter(type){return {"Small Dog":"SD","Large Dog":"LD","Cat":"C","Horse":"H","Other Companion":"OC"}[type]||"C";}
    function companionDefaultPicture(type){return {"Small Dog":0,"Large Dog":2,"Cat":4,"Horse":6,"Other Companion":8}[type]||0;}
    function companionSpritePosition(index){var col=index%3,row=Math.floor(index/3);return (col*50)+"% "+(row*50)+"%";}
    function chooseCompanionPicture(index,type,button){
      companionDraft.petIndex=index;companionDraft.type=type;companionDraft.photo="";
      var photoField=document.getElementById("companionPhoto");if(photoField)photoField.value="";
      document.querySelectorAll(".companion-picture").forEach(function(choice){choice.classList.toggle("active",choice===button);});
      document.querySelectorAll('[data-companion-group="type"] .companion-choice').forEach(function(choice){choice.classList.toggle("active",choice.getAttribute("data-value")===type);});
      previewCompanion();
    }
    function chooseCompanionOption(group,value,button){
      companionDraft[group]=value;
      document.querySelectorAll('[data-companion-group="'+group+'"] .companion-choice').forEach(function(choice){choice.classList.toggle("active",choice===button);});
      if(group==="type"){
        companionDraft.photo="";companionDraft.petIndex=companionDefaultPicture(value);
        var photoField=document.getElementById("companionPhoto");if(photoField)photoField.value="";
        document.querySelectorAll(".companion-picture").forEach(function(choice){choice.classList.toggle("active",Number(choice.getAttribute("data-pet-index"))===companionDraft.petIndex);});
      }
      previewCompanion();
    }
    function companionFormValue(id){var field=document.getElementById(id);return field?field.value.trim():"";}
    function previewCompanion(){
      var name=companionFormValue("companionName")||"My Companion";
      var personality=companionFormValue("companionPersonality");
      var place=companionFormValue("companionRestingPlace");
      var level=document.getElementById("companionLevel")?document.getElementById("companionLevel").value:"Gentle";
      document.getElementById("companionPreviewName").textContent=name;
      document.getElementById("companionPreviewDetails").textContent=[companionDraft.type,personality,level+" interaction"].filter(Boolean).join(" • ");
      document.getElementById("companionPresence").textContent=name+" "+companionDraft.mode.toLowerCase()+(place?" and rests "+place.toLowerCase():"")+".";
      var portrait=document.getElementById("companionPortrait"),monogram=document.getElementById("companionMonogram");
      monogram.textContent=companionTypeLetter(companionDraft.type);
      portrait.style.backgroundImage=companionDraft.photo?'url("'+companionDraft.photo+'")':'url("companion-pets.png?v=59")';
      portrait.style.backgroundSize=companionDraft.photo?"cover":"300% 300%";
      portrait.style.backgroundPosition=companionDraft.photo?"center":companionSpritePosition(companionDraft.petIndex);
      portrait.style.backgroundRepeat="no-repeat";
      monogram.style.display="none";
    }
    function saveCompanion(){
      var name=companionFormValue("companionName");
      if(!name){document.getElementById("companionPresence").textContent="Choose a name for your companion first.";document.getElementById("companionName").focus();return;}
      var state={enabled:true,type:companionDraft.type,mode:companionDraft.mode,name:name,appearance:companionFormValue("companionAppearance"),personality:companionFormValue("companionPersonality"),restingPlace:companionFormValue("companionRestingPlace"),level:document.getElementById("companionLevel").value,sounds:document.getElementById("companionSounds").value,photo:companionDraft.photo,petIndex:companionDraft.petIndex};
      try{localStorage.setItem("meltdownCompanion",JSON.stringify(state));document.getElementById("companionPresence").textContent=name+" is ready to join you in the way you chose.";updateCompanionDock("companion");}
      catch(error){document.getElementById("companionPresence").textContent="This device could not save that photo. Try a smaller photo or save without one.";}
    }
    function loadCompanion(){
      var state=companionSaved()||{type:"Small Dog",mode:"Follows me",name:"",appearance:"",personality:"",restingPlace:"",level:"Gentle",sounds:"off",photo:"",petIndex:0};
      companionDraft={type:state.type||"Small Dog",mode:state.mode||"Follows me",photo:state.photo||"",petIndex:Number.isInteger(state.petIndex)?state.petIndex:companionDefaultPicture(state.type||"Small Dog")};
      [["companionName",state.name],["companionAppearance",state.appearance],["companionPersonality",state.personality],["companionRestingPlace",state.restingPlace],["companionLevel",state.level||"Gentle"],["companionSounds",state.sounds||"off"]].forEach(function(pair){var field=document.getElementById(pair[0]);if(field)field.value=pair[1]||"";});
      ["type","mode"].forEach(function(group){document.querySelectorAll('[data-companion-group="'+group+'"] .companion-choice').forEach(function(button){button.classList.toggle("active",button.getAttribute("data-value")===companionDraft[group]);});});
      document.querySelectorAll(".companion-picture").forEach(function(button){button.classList.toggle("active",Number(button.getAttribute("data-pet-index"))===companionDraft.petIndex);});
      var photoField=document.getElementById("companionPhoto");if(photoField)photoField.value="";previewCompanion();
    }
    function removeCompanion(){
      var state=companionSaved();if(!state){document.getElementById("companionPresence").textContent="No companion is currently saved.";return;}
      if(!window.confirm("Remove this saved companion from the app?"))return;
      localStorage.removeItem("meltdownCompanion");loadCompanion();updateCompanionDock("companion");document.getElementById("companionPresence").textContent="Companion removed. You can choose another whenever you want.";
    }
    function runCompanionInteraction(action){
      var state=companionSaved(),name=(state&&state.name)||companionFormValue("companionName")||"Your companion";
      var messages={come:name+" comes with you at your chosen pace.",sit:name+" settles nearby without asking anything from you.",comfort:name+" stays close while you breathe. You do not have to explain.",play:name+" is ready for a little movement, play, or a quiet walk."};
      document.getElementById("companionPresence").textContent=messages[action]||name+" is here.";
    }
    function updateCompanionDock(screenId){
      var state=companionSaved(),dock=document.getElementById("companionDock"),hidden=["home","entrance","map","companion"].indexOf(screenId)>-1;
      if(!state||!state.enabled||hidden){dock.classList.remove("show");return;}
      document.getElementById("companionDockName").textContent=state.name||"MY COMPANION";document.getElementById("companionDockMode").textContent=state.mode||"Calm background presence";dock.classList.add("show");
    }
    loadCompanion();

    window.addEventListener("hashchange",function(){var id=window.location.hash.replace("#","");if(document.getElementById(id)&&id!==currentRoom)showScreen(id);});


    var outdoorAudioContext=null;
    var outdoorSoundState={};
    var outdoorPlace="";
    var outdoorGroundStep=0;
    var outdoorBreathTimer=null;
    var outdoorStill=false;


    function localOutdoorSeason(){
      var month=new Date().getMonth()+1;
      return month>=3&&month<=5?"spring":month>=6&&month<=8?"summer":month>=9&&month<=11?"fall":"winter";
    }
    function openOutdoorSetup(){
      var panel=document.getElementById("outdoorSetup");if(panel)panel.hidden=false;
      var useTime=document.getElementById("outdoorUseLocalTime"),useSeason=document.getElementById("outdoorUseLocalSeason");
      if(useTime)useTime.checked=localStorage.getItem("meltdownOutdoorUseLocalTime")!=="false";
      if(useSeason)useSeason.checked=localStorage.getItem("meltdownOutdoorUseLocalSeason")!=="false";
      var time=document.getElementById("outdoorStartingTime"),weather=document.getElementById("outdoorStartingWeather"),place=document.getElementById("outdoorStartingPlace");
      if(time)time.value=localStorage.getItem("meltdownOutdoorTime")||"day";
      if(weather)weather.value=localStorage.getItem("meltdownOutdoorWeather")||"sunny";
      if(place)place.value=localStorage.getItem("meltdownOutdoorPlace")||"Front Porch";
      updateOutdoorLocationStatus();
      if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});
    }
    function updateOutdoorLocationStatus(message){
      var node=document.getElementById("outdoorLocationStatus");if(!node)return;
      if(message){node.textContent=message;return}
      var choice=localStorage.getItem("meltdownOutdoorLocationChoice");
      node.textContent=choice==="device"?"Current device location is enabled on this device.":choice==="private"?"Location is private. The room still works normally.":"Location is optional and stays on this device.";
    }
    function requestOutdoorLocation(){keepOutdoorLocationPrivate();updateOutdoorLocationStatus("Location is disabled in this privacy-first version. The room still works normally.");}
    function keepOutdoorLocationPrivate(){
      localStorage.setItem("meltdownOutdoorLocationChoice","private");
      localStorage.removeItem("meltdownOutdoorLatitude");localStorage.removeItem("meltdownOutdoorLongitude");
      updateOutdoorLocationStatus("Location is private. The room still works normally.");
    }
    function saveOutdoorSetup(){
      var useTime=document.getElementById("outdoorUseLocalTime").checked,useSeason=document.getElementById("outdoorUseLocalSeason").checked;
      var chosenTime=document.getElementById("outdoorStartingTime").value,chosenWeather=document.getElementById("outdoorStartingWeather").value,chosenPlace=document.getElementById("outdoorStartingPlace").value;
      localStorage.setItem("meltdownOutdoorUseLocalTime",String(useTime));localStorage.setItem("meltdownOutdoorUseLocalSeason",String(useSeason));
      localStorage.setItem("meltdownOutdoorSetupComplete","true");localStorage.setItem("meltdownOutdoorPlace",chosenPlace);outdoorPlace=chosenPlace;
      setOutdoorTime(useTime?"auto":chosenTime);setOutdoorSeason(useSeason?localOutdoorSeason():(localStorage.getItem("meltdownOutdoorSeason")||"summer"));setOutdoorWeather(chosenWeather,true);
      var panel=document.getElementById("outdoorSetup");if(panel)panel.hidden=true;
      outdoorSay("Welcome to the "+chosenPlace+". Your starting choices are saved on this device.");
    }

    function outdoorSay(message){
      var status=document.getElementById("outdoorStatus");
      if(status) status.textContent=message;
    }
    function outdoorAudio(){
      if(!outdoorAudioContext) outdoorAudioContext=new (window.AudioContext||window.webkitAudioContext)();
      if(outdoorAudioContext.state==="suspended") outdoorAudioContext.resume();
      return outdoorAudioContext;
    }
    function outdoorGain(ctx,level){
      var gain=ctx.createGain();gain.gain.value=level;gain.connect(ctx.destination);return gain;
    }
    function outdoorNoise(ctx,gain,filterType,frequency){
      var length=ctx.sampleRate*2,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
      for(var i=0;i<length;i++) data[i]=Math.random()*2-1;
      var src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
      filter.type=filterType;filter.frequency.value=frequency;src.buffer=buffer;src.loop=true;src.connect(filter);filter.connect(gain);src.start();
      return src;
    }
    function outdoorChirp(ctx,gain,low,high,duration){
      var osc=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;
      osc.type="sine";osc.frequency.setValueAtTime(low,now);osc.frequency.exponentialRampToValueAtTime(high,now+duration*.45);osc.frequency.exponentialRampToValueAtTime(low*1.15,now+duration);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.12,now+.03);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(g);g.connect(gain);osc.start(now);osc.stop(now+duration+.02);
    }
    function startOutdoorSound(name){
      if(outdoorSoundState[name]) return;
      var ctx=outdoorAudio(),gain=outdoorGain(ctx,name==="music"?.07:.1),entry={gain:gain,nodes:[],timers:[]};
      outdoorSoundState[name]=entry;
      if(name==="stream") entry.nodes.push(outdoorNoise(ctx,gain,"lowpass",1300));
      if(name==="rain") entry.nodes.push(outdoorNoise(ctx,gain,"highpass",900));
      if(name==="fire"){
        entry.nodes.push(outdoorNoise(ctx,gain,"bandpass",520));
        entry.timers.push(setInterval(function(){outdoorChirp(ctx,gain,180,110,.08)},700));
      }
      if(name==="birds"){
        var bird=function(){outdoorChirp(ctx,gain,1200+Math.random()*500,2600+Math.random()*900,.25)};
        bird();entry.timers.push(setInterval(bird,1800));
      }
      if(name==="crickets"){
        var cricket=function(){for(var n=0;n<3;n++) setTimeout(function(){outdoorChirp(ctx,gain,3600,4200,.06)},n*110)};
        cricket();entry.timers.push(setInterval(cricket,1450));
      }
      if(name==="music"){
        [196,246.94,293.66].forEach(function(freq,index){var osc=ctx.createOscillator();osc.type="sine";osc.frequency.value=freq;osc.connect(gain);osc.start();entry.nodes.push(osc)});
      }
      var button=document.querySelector('[data-outdoor-sound="'+name+'"]');
      if(button) button.setAttribute("aria-pressed","true");
      outdoorSay(name.charAt(0).toUpperCase()+name.slice(1)+" sound is on. Tap it again to turn it off.");
    }
    function stopOutdoorSound(name){
      var entry=outdoorSoundState[name];if(!entry)return;
      entry.timers.forEach(function(timer){clearInterval(timer)});
      entry.nodes.forEach(function(node){try{node.stop()}catch(error){}});
      try{entry.gain.disconnect()}catch(error){}
      delete outdoorSoundState[name];
      var button=document.querySelector('[data-outdoor-sound="'+name+'"]');
      if(button) button.setAttribute("aria-pressed","false");
    }
    function toggleOutdoorSound(name){
      if(outdoorSoundState[name]){stopOutdoorSound(name);outdoorSay(name.charAt(0).toUpperCase()+name.slice(1)+" sound is off.");}
      else startOutdoorSound(name);
    }
    function stopOutdoorSounds(){
      Object.keys(outdoorSoundState).forEach(stopOutdoorSound);
      outdoorSay("All Outdoor Room sounds are off.");
    }
    function ensureOutdoorSound(name){if(name&&!outdoorSoundState[name])startOutdoorSound(name)}
    function visitOutdoorPlace(place,sound){
      outdoorPlace=place;localStorage.setItem("meltdownOutdoorPlace",place);ensureOutdoorSound(sound);
      outdoorSay("You are at the "+place+". Stay, listen, breathe, or save it as your favorite spot.");
    }
    function outdoorSetChoice(kind,value){
      document.querySelectorAll('[data-outdoor-'+kind+']').forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute('data-outdoor-'+kind)===value))});
      localStorage.setItem("meltdownOutdoor"+kind.charAt(0).toUpperCase()+kind.slice(1),value);
    }
    function setOutdoorTime(value){
      if(value==="auto"){var hour=new Date().getHours();value=hour<10?"morning":hour<17?"day":hour<21?"sunset":"night"}
      var stage=document.getElementById("outdoorStage");if(!stage)return;
      ["morning","day","sunset","night"].forEach(function(v){stage.classList.remove("time-"+v)});stage.classList.add("time-"+value);
      outdoorSetChoice("time",value);outdoorSay("The property is now set to "+value+".");
    }
    function setOutdoorSeason(value){
      var stage=document.getElementById("outdoorStage");if(!stage)return;
      ["spring","summer","fall","winter"].forEach(function(v){stage.classList.remove("season-"+v)});stage.classList.add("season-"+value);
      outdoorSetChoice("season",value);outdoorSay("The property is now in "+value+".");
    }
    function setOutdoorWeather(value,silent){
      var stage=document.getElementById("outdoorStage");if(!stage)return;
      ["sunny","cloudy","rain","snow","storm"].forEach(function(v){stage.classList.remove("weather-"+v)});stage.classList.add("weather-"+value);
      outdoorSetChoice("weather",value);
      if(!silent){
        if(value==="rain"||value==="storm")ensureOutdoorSound("rain");
        else if(outdoorSoundState.rain)stopOutdoorSound("rain");
      }
      outdoorSay(value.charAt(0).toUpperCase()+value.slice(1)+" weather is active.");
    }
    function toggleOutdoorMotion(){
      outdoorStill=!outdoorStill;var stage=document.getElementById("outdoorStage"),button=document.getElementById("outdoorMotionButton");
      if(stage)stage.classList.toggle("paused",outdoorStill);if(button)button.setAttribute("aria-pressed",String(outdoorStill));
      outdoorSay(outdoorStill?"Still Mode is on. Property movement is paused.":"Property movement is on.");
    }
    function resetOutdoorView(){
      setOutdoorTime("day");setOutdoorSeason("summer");setOutdoorWeather("sunny");
      if(outdoorStill)toggleOutdoorMotion();stopOutdoorSounds();outdoorSay("The Living Property view has been reset.");
    }
    function startOutdoorBreathing(){
      clearInterval(outdoorBreathTimer);var node=document.getElementById("outdoorBreathe"),steps=["Breathe in… 4","Hold… 2","Breathe out… 6","Rest… 2"],i=0;
      if(node)node.textContent=steps[0];outdoorSay("Follow the slow breathing guide.");
      outdoorBreathTimer=setInterval(function(){i++;if(i>=steps.length){clearInterval(outdoorBreathTimer);outdoorBreathTimer=null;if(node)node.textContent="You did it. Take another breath whenever you need.";return}if(node)node.textContent=steps[i]},3000);
    }
    function nextOutdoorGrounding(){
      var prompts=["Name 5 things you can see.","Name 4 things you can feel.","Name 3 things you can hear.","Name 2 things you can smell.","Name 1 thing you can taste or appreciate."];
      outdoorSay(prompts[outdoorGroundStep]);outdoorGroundStep=(outdoorGroundStep+1)%prompts.length;
    }
    function saveOutdoorFavorite(){
      var place=outdoorPlace||localStorage.getItem("meltdownOutdoorPlace")||"Front Porch";
      localStorage.setItem("meltdownOutdoorFavorite",place);var node=document.getElementById("outdoorFavorite");if(node)node.textContent="Favorite spot: "+place;
      outdoorSay(place+" is saved as your favorite Outdoor Room spot.");
    }
    function saveOutdoorNotes(){var node=document.getElementById("outdoorNotes");if(node)localStorage.setItem("meltdownOutdoorNotes",node.value)}
    function startCompanionWalk(){
      var companion=null;try{companion=JSON.parse(localStorage.getItem("meltdownCompanion")||"null")}catch(error){}
      if(!companion){outdoorSay("Choose your companion first, then return for a walk.");showScreen("companion");return}
      var name=companion.name||companion.type||"your companion",place=outdoorPlace||"Adventure Trail";
      outdoorSay(name+" is walking with you at the "+place+". You choose the pace.");
    }
    function initOutdoorRoom(){
      var notes=document.getElementById("outdoorNotes"),favorite=document.getElementById("outdoorFavorite"),setup=document.getElementById("outdoorSetup");
      if(notes)notes.value=localStorage.getItem("meltdownOutdoorNotes")||"";
      var savedFavorite=localStorage.getItem("meltdownOutdoorFavorite");if(favorite&&savedFavorite)favorite.textContent="Favorite spot: "+savedFavorite;
      var useLocalTime=localStorage.getItem("meltdownOutdoorUseLocalTime")!=="false",useLocalSeason=localStorage.getItem("meltdownOutdoorUseLocalSeason")!=="false";
      setOutdoorTime(useLocalTime?"auto":(localStorage.getItem("meltdownOutdoorTime")||"day"));
      setOutdoorSeason(useLocalSeason?localOutdoorSeason():(localStorage.getItem("meltdownOutdoorSeason")||"summer"));
      setOutdoorWeather(localStorage.getItem("meltdownOutdoorWeather")||"sunny",true);
      outdoorPlace=localStorage.getItem("meltdownOutdoorPlace")||"";
      var firstVisit=localStorage.getItem("meltdownOutdoorSetupComplete")!=="true";if(setup)setup.hidden=!firstVisit;
      if(firstVisit)openOutdoorSetup();else outdoorSay(outdoorPlace?"Welcome back to the "+outdoorPlace+".":"Choose a peaceful place to begin.");
    }


    var resourceCatalog=[
      {id:"cdc-parenting",category:"Parenting Support",title:"CDC Positive Parenting Tips",description:"Age-based parenting, health, development, and safety guidance.",url:"https://www.cdc.gov/child-development/positive-parenting-tips/index.html",source:"CDC"},
      {id:"cdc-parenting-tools",category:"Parenting Support",title:"CDC Essentials for Parenting",description:"Communication, structure, directions, and positive relationship tools.",url:"https://www.cdc.gov/parenting-toddlers/about/index.html",source:"CDC"},
      {id:"cdc-milestones",category:"Learning & Development",title:"Learn the Signs. Act Early.",description:"Free developmental milestone information and family resources.",url:"https://www.cdc.gov/act-early/index.html",source:"CDC"},
      {id:"idea-early",category:"Learning & Development",title:"IDEA Early Learning Resources",description:"Official early intervention and early childhood resources.",url:"https://sites.ed.gov/idea/early-learning-early-childhood/",source:"U.S. Department of Education"},
      {id:"samhsa",category:"Health & Wellness",title:"Find Mental Health or Substance Use Support",description:"Confidential treatment and support locators for individuals and families.",url:"https://www.samhsa.gov/find-help/locators",source:"SAMHSA"},
      {id:"988",category:"Health & Wellness",title:"988 Suicide & Crisis Lifeline",description:"Call, text, or chat for crisis support in the United States.",url:"https://988lifeline.org/",source:"988 Lifeline"},
      {id:"cfpb-family",category:"Financial Guidance",title:"Money as You Grow",description:"Activities and guidance for parents and caregivers building family money skills.",url:"https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/",source:"Consumer Financial Protection Bureau"},
      {id:"usa-benefits",category:"Financial Guidance",title:"Government Benefits",description:"Find government programs that may help with food, health, housing, and other needs.",url:"https://www.usa.gov/benefits",source:"USA.gov"},
      {id:"211",category:"Community Support",title:"Find Your Local 211",description:"Confidential connections to local food, housing, transportation, health, and family services.",url:"https://211.org/about-us/your-local-211",source:"United Way 211"},
      {id:"parent-centers",category:"Community Support",title:"Find a Parent Information Center",description:"Locate family training and information centers serving every state and territory.",url:"https://www.ed.gov/grants-and-programs/grants-special-populations/grants-special-education-and-individuals-disabilities/special-education-parent-information-centers",source:"U.S. Department of Education"},
      {id:"idea-family",category:"Education Center",title:"IDEA Resources for Parents and Families",description:"Official special education rights, IEP information, and family resources.",url:"https://sites.ed.gov/idea/parents-families/",source:"U.S. Department of Education"},
      {id:"idea-law",category:"Education Center",title:"Individuals with Disabilities Education Act",description:"Official information about IDEA protections and services.",url:"https://www.ed.gov/laws-and-policy/individuals-disabilities/individuals-disabilities-education-act-idea",source:"U.S. Department of Education"},
      {id:"ready-family",category:"Safety & Preparedness",title:"Make a Family Emergency Plan",description:"Official planning guidance and a printable family emergency plan.",url:"https://www.ready.gov/plan",source:"Ready.gov"},
      {id:"poison",category:"Safety & Preparedness",title:"Poison Control",description:"Online guidance and the U.S. Poison Help line: 1-800-222-1222.",url:"https://www.poison.org/",source:"Poison Control"},
      {id:"print-family",category:"Forms & Printables",title:"Family Support Plan",description:"Create a printable plan for needs, helpers, strengths, and next steps.",print:"family"},
      {id:"print-iep",category:"Forms & Printables",title:"IEP Meeting Notes",description:"Create a printable page for questions, concerns, decisions, and follow-up.",print:"iep"}
    ];
    function getResourceFavorites(){try{return JSON.parse(localStorage.getItem("meltdownResourceFavorites")||"[]")}catch(error){return[]}}
    function getCustomResources(){try{return JSON.parse(localStorage.getItem("meltdownCustomResources")||"[]")}catch(error){return[]}}
    function resourceEscape(value){var node=document.createElement("div");node.textContent=value||"";return node.innerHTML}
    function allResources(){return resourceCatalog.concat(getCustomResources())}
    function openResourceHub(){
      var shell=document.querySelector("#resources .resource-shell");if(shell)shell.classList.add("resource-open");
      var select=document.getElementById("resourceCategory");if(select)select.value="All";
      var search=document.getElementById("resourceSearch");if(search)search.value="";
      renderResources();
      var panel=document.querySelector("#resources .resource-panel");if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});
    }
    function openResourceCategory(category){
      var shell=document.querySelector("#resources .resource-shell");if(shell)shell.classList.add("resource-open");
      var select=document.getElementById("resourceCategory");if(select)select.value=category;
      var search=document.getElementById("resourceSearch");if(search)search.value="";
      renderResources();var panel=document.getElementById("resourceList");if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});
    }
    function renderResources(onlyFavorites){
      var list=document.getElementById("resourceList");if(!list)return;
      var category=document.getElementById("resourceCategory").value,query=document.getElementById("resourceSearch").value.trim().toLowerCase(),favorites=getResourceFavorites();
      var items=allResources().filter(function(item){
        var categoryMatch=category==="All"||category==="My Resources"&&item.custom||item.category===category;
        var queryMatch=!query||(item.title+" "+item.description+" "+item.category+" "+(item.source||"")).toLowerCase().includes(query);
        return categoryMatch&&queryMatch&&(!onlyFavorites||favorites.includes(item.id));
      });
      if(!items.length){list.innerHTML='<div class="resource-item"><h3>No matching resources yet</h3><p>Try another category, remove the search words, or add your own trusted resource below.</p></div>';}
      else list.innerHTML=items.map(function(item){
        var action=item.print?'<button type="button" data-mr-action="printResourceSheet(\''+item.print+'\')">OPEN PRINTABLE</button>':'<a href="'+resourceEscape(item.url)+'" target="_blank" rel="noopener noreferrer">OPEN TRUSTED RESOURCE</a>';
        return '<article class="resource-item"><button class="resource-favorite" type="button" data-mr-action="toggleResourceFavorite(\''+item.id+'\')" aria-pressed="'+String(favorites.includes(item.id))+'" aria-label="'+(favorites.includes(item.id)?"Remove ":"Save ")+resourceEscape(item.title)+(favorites.includes(item.id)?" from favorites":" as a favorite")+'">'+(favorites.includes(item.id)?"♥":"♡")+'</button><h3>'+resourceEscape(item.title)+'</h3><p>'+resourceEscape(item.description)+'</p><small>'+(item.source?resourceEscape(item.source):"Saved by you")+'</small><br>'+action+'</article>';
      }).join("");
      document.querySelectorAll(".resource-category-buttons button").forEach(function(button){var pressed=onlyFavorites?button.hasAttribute("data-resource-favorites"):button.getAttribute("data-resource-category")===category;button.setAttribute("aria-pressed",String(pressed))});
      resourceSay((onlyFavorites?"Favorite resources: ":"Resources shown: ")+items.length);
    }
    function showResourceFavorites(){var shell=document.querySelector("#resources .resource-shell");if(shell)shell.classList.add("resource-open");document.getElementById("resourceCategory").value="All";document.getElementById("resourceSearch").value="";renderResources(true)}
    function toggleResourceFavorite(id){
      var favorites=getResourceFavorites(),index=favorites.indexOf(id);if(index>=0)favorites.splice(index,1);else favorites.push(id);
      localStorage.setItem("meltdownResourceFavorites",JSON.stringify(favorites));renderResources();resourceSay(index>=0?"Removed from favorites.":"Saved to favorites on this device.");
    }
    function saveCustomResource(){
      var name=document.getElementById("resourceCustomName").value.trim(),url=document.getElementById("resourceCustomUrl").value.trim(),category=document.getElementById("resourceCustomCategory").value;
      if(!name){resourceSay("Please enter a resource name.");return}
      try{var parsed=new URL(url);if(parsed.protocol!=="https:"&&parsed.protocol!=="http:")throw new Error("bad")}catch(error){resourceSay("Please enter a complete website beginning with https://");return}
      var items=getCustomResources();items.push({id:"custom-"+Date.now(),custom:true,title:name,url:url,category:category,description:"Personal family resource."});
      localStorage.setItem("meltdownCustomResources",JSON.stringify(items));document.getElementById("resourceCustomName").value="";document.getElementById("resourceCustomUrl").value="";
      document.getElementById("resourceCategory").value="My Resources";renderResources();resourceSay("Your resource was saved on this device.");
    }
    function resourceSay(message){var node=document.getElementById("resourceStatus");if(node)node.textContent=message}
    function printResourceSheet(type){
      var sheets={
        family:{title:"Family Support Plan",lines:["What our family needs right now","Our strengths","People we can ask for help","One next step","Follow-up date"]},
        routine:{title:"Weekly Routine",lines:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
        appointment:{title:"Appointment Notes",lines:["Date and provider","Main concern","Questions to ask","Notes and answers","Next steps and follow-up"]},
        iep:{title:"IEP Meeting Notes",lines:["Student strengths","Parent concerns","Questions","Supports and accommodations discussed","Decisions made","Who will follow up and when"]},
        emergency:{title:"Family Emergency Contacts",lines:["Emergency services: 911","Crisis support: 988","Local help: 211","Family contact","Medical provider","School or caregiver","Meeting place"]}
      },sheet=sheets[type]||sheets.family,printable=document.getElementById("resourcePrintable");
      printable.classList.add("open");
      printable.innerHTML='<h2>The Meltdown Room — '+resourceEscape(sheet.title)+'</h2><p>Name: ____________________ &nbsp; Date: ____________________</p>'+sheet.lines.map(function(line){return '<div class="resource-printable-line"><strong>'+resourceEscape(line)+'</strong><span></span><span></span></div>'}).join("")+'<p><small>This planning sheet is not medical, legal, or emergency advice.</small></p><div class="resource-printable-actions"><button type="button" data-resource-print-action="print">PRINT THIS SHEET</button><button type="button" data-resource-print-action="close">CLOSE</button></div>';
      printable.scrollIntoView({behavior:document.body.classList.contains("still-mode")?"auto":"smooth",block:"start"});resourceSay(sheet.title+" is ready to print.");
    }
    function printOpenResourceSheet(){document.body.classList.add("printing-resource-sheet");window.addEventListener("afterprint",function done(){document.body.classList.remove("printing-resource-sheet");window.removeEventListener("afterprint",done)});window.print()}
    document.addEventListener("click",function(event){var button=event.target.closest("[data-resource-print-action]");if(!button)return;var action=button.getAttribute("data-resource-print-action");if(action==="print")printOpenResourceSheet();else{var printable=document.getElementById("resourcePrintable");printable.classList.remove("open");printable.innerHTML=""}});
    function initResourceShed(){renderResources();resourceSay("Trusted starter resources are connected. Choose a category or search for help.")}


    var exploreState={category:"Parks",distance:"10 miles",party:"Family",filters:[],locationLabel:""};
    function exploreSay(message){var node=document.getElementById("exploreStatus");if(node)node.textContent=message}
    function chooseExploreCategory(category){
      exploreState.category=category;document.querySelectorAll("[data-explore-category]").forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-explore-category")===category))});
      exploreSay(category+" selected. Choose your filters and location, then show options.");
    }
    function setExploreDistance(distance){
      exploreState.distance=distance;document.querySelectorAll("[data-explore-distance]").forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-explore-distance")===distance))});
      exploreSay("Search distance set to "+distance+".");
    }
    function setExploreParty(party){
      exploreState.party=party;document.querySelectorAll("[data-explore-party]").forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-explore-party")===party))});
      exploreSay(party+" selected.");
    }
    function toggleExploreFilter(filter,button){
      var index=exploreState.filters.indexOf(filter);if(index>=0)exploreState.filters.splice(index,1);else exploreState.filters.push(filter);
      button.setAttribute("aria-pressed",String(index<0));exploreSay(filter+" filter "+(index<0?"added.":"removed."));
    }
    function toggleExploreAdvanced(){var panel=document.getElementById("exploreAdvanced");if(panel)panel.hidden=!panel.hidden}
    function useExploreLocation(){keepExploreLocationPrivate();exploreSay("Location services are disabled in this privacy-first version.");}
    function keepExploreLocationPrivate(){
      localStorage.setItem("meltdownExploreLocationChoice","private");localStorage.removeItem("meltdownExploreLatitude");localStorage.removeItem("meltdownExploreLongitude");exploreState.locationLabel="";
      exploreSay("Location is disabled. Browse ideas without sharing a location.");
    }
    function exploreLocation(){return "";}
    function exploreQuery(extra){
      var pieces=[extra||exploreState.category,exploreState.party==="Pets"?"pet friendly":"",exploreState.party==="Kids"||exploreState.party==="Family"?"family friendly":"",exploreState.filters.join(" ")];
      return pieces.filter(Boolean).join(" ");
    }
    function mapsSearchUrl(query){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(query)}
    function mapsDirectionsUrl(query){return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(query)+"&travelmode=driving"}
    function getExploreFavorites(){try{return JSON.parse(localStorage.getItem("meltdownExploreFavorites")||"[]")}catch(error){return[]}}
    function getExploreRecent(){try{return JSON.parse(localStorage.getItem("meltdownExploreRecent")||"[]")}catch(error){return[]}}
    function getExploreTrips(){try{return JSON.parse(localStorage.getItem("meltdownExploreTrips")||"[]")}catch(error){return[]}}
    function exploreEscape(value){var node=document.createElement("div");node.textContent=value||"";return node.innerHTML}
    function findExplorePlaces(){
      var variants=[exploreState.category,"family friendly "+exploreState.category,"quiet "+exploreState.category,"accessible "+exploreState.category];
      var results=variants.map(function(label){return{title:label,query:exploreQuery(label),distance:exploreState.distance,party:exploreState.party}});
      var recent=getExploreRecent();recent.unshift({title:exploreState.category,query:exploreQuery(),date:new Date().toISOString(),distance:exploreState.distance,party:exploreState.party});localStorage.setItem("meltdownExploreRecent",JSON.stringify(recent.slice(0,12)));
      renderExploreCards(results,"Activity ideas");exploreSay("Ideas are ready. No location information was used.");
    }
    function renderExploreCards(items,title){
      var box=document.getElementById("exploreResults");if(!box)return;
      if(!items.length){box.innerHTML='<article class="explore-result"><h3>No saved places yet</h3><p>Run a search or save a favorite to begin.</p></article>';return}
      box.innerHTML=items.map(function(item,index){var query=item.query||item.title;return '<article class="explore-result"><h3>'+exploreEscape(item.title)+'</h3><p>'+exploreEscape(item.distance||exploreState.distance)+' • '+exploreEscape(item.party||exploreState.party)+'</p><div class="explore-result-links"><a href="'+mapsSearchUrl(query)+'" target="_blank" rel="noopener noreferrer">VIEW IN GOOGLE MAPS</a><a href="'+mapsDirectionsUrl(query)+'" target="_blank" rel="noopener noreferrer">GET DIRECTIONS</a></div><div class="explore-actions"><button data-mr-action="saveExploreFavorite(\''+encodeURIComponent(JSON.stringify(item))+'\')">SAVE FAVORITE</button></div></article>'}).join("");
    }
    function saveExploreFavorite(encoded){
      var item=JSON.parse(decodeURIComponent(encoded)),favorites=getExploreFavorites();if(!favorites.some(function(saved){return saved.query===item.query}))favorites.unshift(item);
      localStorage.setItem("meltdownExploreFavorites",JSON.stringify(favorites.slice(0,30)));exploreSay("Saved to Explore favorites on this device.");
    }
    function showExploreFavorites(){renderExploreCards(getExploreFavorites(),"Favorites");exploreSay("Showing your saved Explore favorites.")}
    function showExploreRecent(){renderExploreCards(getExploreRecent(),"Recent places");exploreSay("Showing recent Explore searches from this device.")}
    function saveExploreTrip(){
      var date=document.getElementById("exploreTripDate").value,notes=document.getElementById("exploreTripNotes").value.trim();if(!date&&!notes){exploreSay("Add a date or trip note before saving.");return}
      var trips=getExploreTrips();trips.unshift({title:exploreState.category+" trip",query:exploreQuery(),date:date||"Date not set",party:exploreState.party,distance:exploreState.distance,notes:notes});
      localStorage.setItem("meltdownExploreTrips",JSON.stringify(trips.slice(0,30)));document.getElementById("exploreTripNotes").value="";exploreSay("Trip saved privately on this device.");
    }
    function showExploreTrips(){
      var trips=getExploreTrips(),box=document.getElementById("exploreResults");if(!box)return;
      if(!trips.length){renderExploreCards([],"Trips");exploreSay("No trips saved yet.");return}
      box.innerHTML=trips.map(function(item){return '<article class="explore-result"><h3>'+exploreEscape(item.title)+'</h3><p>'+exploreEscape(item.date)+' • '+exploreEscape(item.party)+'</p><p>'+exploreEscape(item.notes||"")+'</p><div class="explore-result-links"><a href="'+mapsSearchUrl(item.query)+'" target="_blank" rel="noopener noreferrer">VIEW IN GOOGLE MAPS</a><a href="'+mapsDirectionsUrl(item.query)+'" target="_blank" rel="noopener noreferrer">GET DIRECTIONS</a></div></article>'}).join("");exploreSay("Showing saved trips.");
    }
    function initExploreNearMe(){
      chooseExploreCategory(exploreState.category);setExploreDistance(exploreState.distance);setExploreParty(exploreState.party);
      keepExploreLocationPrivate();exploreSay("Choose what sounds good today. No location is requested.");
    }


    var gameCheckersBoard=[],gameCheckerPick=null,gameCheckerTurn="red";
    var gameDartScore=0,gameDartThrows=0;
    var gameSoloDeck=[],gameSoloCurrent=0,gameSoloScore=0,gameSoloRound=0;
    var gamePuzzle={count:25,rows:5,cols:5,tiles:[]};
    var gameBeatTimer=null,gameAudioContext=null,gameLaughIndex=0,gameSuggestedIdea="";
    var gameJokes=[
      "Why did the scarecrow win an award? Because he was outstanding in his field.",
      "What do you call cheese that is not yours? Nacho cheese.",
      "Why could not the bicycle stand up by itself? It was two-tired.",
      "What did one wall say to the other wall? I will meet you at the corner.",
      "Why did the cookie go to the doctor? It felt crummy.",
      "What kind of tree fits in your hand? A palm tree."
    ];
    var gameMovies=[
      "Cozy comedy night: blankets, popcorn, and everyone picks one favorite snack.",
      "Family adventure night: choose a feel-good journey and build a blanket fort.",
      "Animated favorite night: let the youngest person choose, then make hot cocoa.",
      "Old favorite night: rewatch something that always makes your family smile."
    ];
    function gameSay(message){var node=document.getElementById("gameWorkspaceStatus");if(node)node.textContent=message}
    function initGameRoom(){
      var mood=localStorage.getItem("meltdownGameMood")||"bright";setGameMood(mood,false);
      var memories=getGameMemories();var status=document.getElementById("gameStatus");if(status)status.textContent=memories.length?memories.length+" private memor"+(memories.length===1?"y":"ies")+" saved on this device.":"Memories stay privately on this device.";
    }
    function openGameTool(type,size){
      stopGameBeat();
      if(type==="checkers")startCheckersGame();
      else if(type==="darts")startDartsGame();
      else if(type==="solitaire")startSoloCards();
      else if(type==="sudoku")startSudokuGame();
      else if(type==="puzzle")startGamePuzzle(size||25);
      else if(type==="movie")showMovieIdea();
      else if(type==="music")toggleGameBeat();
      else if(type==="laughs")showGameLaugh();
    }
    function startCheckersGame(){
      gameCheckersBoard=Array.from({length:8},function(){return Array(8).fill("")});
      for(var r=0;r<3;r++)for(var c=0;c<8;c++)if((r+c)%2===1)gameCheckersBoard[r][c]="b";
      for(var r2=5;r2<8;r2++)for(var c2=0;c2<8;c2++)if((r2+c2)%2===1)gameCheckersBoard[r2][c2]="r";
      gameCheckerPick=null;gameCheckerTurn="red";renderCheckersGame();gameSay("Checkers ready. Red moves first.");
    }
    function checkerColor(piece){return piece.toLowerCase()==="r"?"red":"black"}
    function renderCheckersGame(){
      var box=document.getElementById("gameWorkspace");if(!box)return;
      var html='<h3>Checkers — Two Players</h3><p id="checkerTurn">Turn: '+gameCheckerTurn+'</p><div class="checker-board" role="grid" aria-label="Checkers board">';
      for(var r=0;r<8;r++)for(var c=0;c<8;c++){
        var piece=gameCheckersBoard[r][c],dark=(r+c)%2===1,selected=gameCheckerPick&&gameCheckerPick.r===r&&gameCheckerPick.c===c;
        html+='<button class="checker-cell '+(dark?"dark ":"")+(selected?"selected":"")+'" data-mr-action="chooseChecker('+r+','+c+')" aria-label="Row '+(r+1)+' column '+(c+1)+(piece?" "+checkerColor(piece)+" piece":" empty")+'">'+(piece?'<span class="checker-piece '+checkerColor(piece)+(piece===piece.toUpperCase()?" king":"")+'"></span>':"")+'</button>';
      }
      box.innerHTML=html+'</div><button data-mr-action="startCheckersGame()">NEW GAME</button>';
    }
    function chooseChecker(r,c){
      var piece=gameCheckersBoard[r][c];
      if(!gameCheckerPick){
        if(!piece||checkerColor(piece)!==gameCheckerTurn){gameSay("Choose a "+gameCheckerTurn+" piece.");return}
        gameCheckerPick={r:r,c:c};renderCheckersGame();gameSay("Piece selected. Choose a diagonal square.");return;
      }
      if(piece&&checkerColor(piece)===gameCheckerTurn){gameCheckerPick={r:r,c:c};renderCheckersGame();return}
      var from=gameCheckerPick,moving=gameCheckersBoard[from.r][from.c],dr=r-from.r,dc=c-from.c,isKing=moving===moving.toUpperCase(),forward=checkerColor(moving)==="red"?-1:1,valid=false,captured=null;
      if(!piece&&Math.abs(dc)===1&&Math.abs(dr)===1&&(isKing||dr===forward))valid=true;
      if(!piece&&Math.abs(dc)===2&&Math.abs(dr)===2&&(isKing||dr===forward*2)){
        var mr=from.r+dr/2,mc=from.c+dc/2,mid=gameCheckersBoard[mr][mc];
        if(mid&&checkerColor(mid)!==gameCheckerTurn){valid=true;captured={r:mr,c:mc}}
      }
      if(!valid){gameSay("That move is not available.");gameCheckerPick=null;renderCheckersGame();return}
      gameCheckersBoard[r][c]=moving;gameCheckersBoard[from.r][from.c]="";if(captured)gameCheckersBoard[captured.r][captured.c]="";
      if((moving==="r"&&r===0)||(moving==="b"&&r===7))gameCheckersBoard[r][c]=moving.toUpperCase();
      gameCheckerPick=null;var other=gameCheckerTurn==="red"?"black":"red";
      var otherLeft=gameCheckersBoard.some(function(row){return row.some(function(p){return p&&checkerColor(p)===other})});
      if(!otherLeft){gameSay(gameCheckerTurn+" wins!");renderCheckersGame();return}
      gameCheckerTurn=other;renderCheckersGame();gameSay(gameCheckerTurn+" to move.");
    }
    function startDartsGame(){
      gameDartScore=0;gameDartThrows=0;
      document.getElementById("gameWorkspace").innerHTML='<h3>Darts — Tap to Throw</h3><p>Ten throws. Aim for the center.</p><div class="game-dartboard" data-mr-action="throwGameDart(event)" role="button" tabindex="0" aria-label="Dartboard"></div><p id="gameDartReadout">Score: 0 • Throws: 0/10</p><button data-mr-action="startDartsGame()">NEW ROUND</button>';
      gameSay("Stand back in real life. In the app, tap the dartboard to throw.");
    }
    function throwGameDart(event){
      if(gameDartThrows>=10){gameSay("Round complete. Start a new round to throw again.");return}
      var board=event.currentTarget,rect=board.getBoundingClientRect(),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2,radius=Math.sqrt(x*x+y*y)/(rect.width/2),points=0;
      if(radius<=.08)points=50;else if(radius<=.2)points=25;else if(radius<=.38)points=20;else if(radius<=.56)points=15;else if(radius<=.74)points=10;else if(radius<=1)points=5;
      gameDartThrows++;gameDartScore+=points;document.getElementById("gameDartReadout").textContent="Score: "+gameDartScore+" • Throws: "+gameDartThrows+"/10";
      gameSay(points?points+" points!": "Missed the board. Try again.");
      if(gameDartThrows===10)gameSay("Round complete — final score "+gameDartScore+".");
    }
    function makeSoloDeck(){var deck=[];for(var suit=0;suit<4;suit++)for(var rank=1;rank<=13;rank++)deck.push({rank:rank,suit:suit});for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=deck[i];deck[i]=deck[j];deck[j]=t}return deck}
    function soloCardLabel(card){var names={1:"A",11:"J",12:"Q",13:"K"},suits=["♣","♦","♥","♠"];return(names[card.rank]||card.rank)+suits[card.suit]}
    function startSoloCards(){gameSoloDeck=makeSoloDeck();gameSoloCurrent=gameSoloDeck.pop();gameSoloScore=0;gameSoloRound=0;renderSoloCards();gameSay("Solo card challenge ready. Guess whether the next card is higher or lower.");}
    function renderSoloCards(){
      var box=document.getElementById("gameWorkspace"),card=gameSoloCurrent;
      box.innerHTML='<h3>Solitaire — High or Low</h3><p>Build the longest correct streak you can.</p><div class="game-cards"><div class="game-card">'+soloCardLabel(card)+'</div></div><p>Score: '+gameSoloScore+' • Cards played: '+gameSoloRound+'</p><button data-mr-action="guessSoloCard(&quot;higher&quot;)">HIGHER</button> <button data-mr-action="guessSoloCard(&quot;lower&quot;)">LOWER</button> <button data-mr-action="startSoloCards()">RESHUFFLE</button>';
    }
    function guessSoloCard(choice){
      if(!gameSoloDeck.length){gameSay("Deck complete! Final score "+gameSoloScore+".");return}
      var next=gameSoloDeck.pop(),correct=choice==="higher"?next.rank>=gameSoloCurrent.rank:next.rank<=gameSoloCurrent.rank;
      gameSoloScore=correct?gameSoloScore+1:0;gameSoloRound++;var before=soloCardLabel(gameSoloCurrent);gameSoloCurrent=next;renderSoloCards();gameSay((correct?"Correct! ":"Not this time. ")+before+" → "+soloCardLabel(next)+".");
    }
    var sudokuPuzzle="530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    var sudokuSolution="534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    function startSudokuGame(){
      var html='<h3>Sudoku</h3><p>Fill every row, column, and 3×3 box with 1–9.</p><div class="sudoku-board">';
      for(var i=0;i<81;i++){var clue=sudokuPuzzle[i]!=="0";html+='<input class="sudoku-cell '+(clue?"clue":"")+'" data-sudoku="'+i+'" value="'+(clue?sudokuPuzzle[i]:"")+'" '+(clue?"readonly":"")+' inputmode="numeric" maxlength="1" aria-label="Sudoku row '+(Math.floor(i/9)+1)+' column '+(i%9+1)+'">'}
      document.getElementById("gameWorkspace").innerHTML=html+'</div><button data-mr-action="checkSudokuGame()">CHECK PUZZLE</button> <button data-mr-action="startSudokuGame()">RESET</button>';
      gameSay("Sudoku ready. Take your time.");
    }
    function checkSudokuGame(){
      var cells=document.querySelectorAll("[data-sudoku]"),complete=true,correct=true;
      cells.forEach(function(cell){var index=Number(cell.getAttribute("data-sudoku")),value=cell.value.replace(/[^1-9]/g,"");cell.value=value;if(!value)complete=false;if(value&&value!==sudokuSolution[index]){correct=false;cell.style.background="#ffd0c7"}else if(!cell.readOnly)cell.style.background="#fff8e6"});
      if(complete&&correct)gameSay("Sudoku complete — beautifully done!");else if(!correct)gameSay("A highlighted square needs another look.");else gameSay("So far so good. Keep going.");
    }
    function startGamePuzzle(count){
      var sizes={25:[5,5],50:[5,10],100:[10,10],500:[20,25]},size=sizes[count]||sizes[25];gamePuzzle={count:count,rows:size[0],cols:size[1],tiles:Array.from({length:count},function(_,i){return i})};gamePuzzle.tiles[count-1]=-1;
      for(var n=0;n<Math.min(4000,count*8);n++){var blank=gamePuzzle.tiles.indexOf(-1),br=Math.floor(blank/gamePuzzle.cols),bc=blank%gamePuzzle.cols,candidates=[];if(br>0)candidates.push(blank-gamePuzzle.cols);if(br<gamePuzzle.rows-1)candidates.push(blank+gamePuzzle.cols);if(bc>0)candidates.push(blank-1);if(bc<gamePuzzle.cols-1)candidates.push(blank+1);var pick=candidates[Math.floor(Math.random()*candidates.length)];gamePuzzle.tiles[blank]=gamePuzzle.tiles[pick];gamePuzzle.tiles[pick]=-1}
      renderGamePuzzle();gameSay(count+"-piece puzzle shuffled. Tap a piece beside the empty space.");
    }
    function renderGamePuzzle(){
      var box=document.getElementById("gameWorkspace"),html='<h3>'+gamePuzzle.count+'-Piece Sliding Puzzle</h3><p>Rebuild the room picture by sliding pieces into the empty space.</p><div class="puzzle-board" style="grid-template-columns:repeat('+gamePuzzle.cols+',1fr);grid-template-rows:repeat('+gamePuzzle.rows+',1fr)">';
      gamePuzzle.tiles.forEach(function(tile,index){if(tile<0)html+='<button class="puzzle-tile blank" aria-label="Empty puzzle space"></button>';else{var row=Math.floor(tile/gamePuzzle.cols),col=tile%gamePuzzle.cols,x=gamePuzzle.cols===1?0:col/(gamePuzzle.cols-1)*100,y=gamePuzzle.rows===1?0:row/(gamePuzzle.rows-1)*100;html+='<button class="puzzle-tile" data-mr-action="moveGamePuzzle('+index+')" style="background-size:'+(gamePuzzle.cols*100)+'% '+(gamePuzzle.rows*100)+'%!important;background-position:'+x+'% '+y+'%" aria-label="Puzzle piece '+(tile+1)+'"></button>'}});
      box.innerHTML=html+'</div><button data-mr-action="startGamePuzzle('+gamePuzzle.count+')">SHUFFLE AGAIN</button>';
    }
    function moveGamePuzzle(index){
      var blank=gamePuzzle.tiles.indexOf(-1),r=Math.floor(index/gamePuzzle.cols),c=index%gamePuzzle.cols,br=Math.floor(blank/gamePuzzle.cols),bc=blank%gamePuzzle.cols;
      if(Math.abs(r-br)+Math.abs(c-bc)!==1){gameSay("Choose a piece beside the empty space.");return}
      gamePuzzle.tiles[blank]=gamePuzzle.tiles[index];gamePuzzle.tiles[index]=-1;renderGamePuzzle();
      var solved=gamePuzzle.tiles.every(function(tile,i){return i===gamePuzzle.count-1?tile===-1:tile===i});gameSay(solved?"Puzzle complete — you did it!":"Piece moved.");
    }
    function showMovieIdea(){var idea=gameMovies[Math.floor(Math.random()*gameMovies.length)];document.getElementById("gameWorkspace").innerHTML='<h3>Movie Night</h3><div class="game-idea">'+idea+'</div><button data-mr-action="showMovieIdea()">ANOTHER IDEA</button>';gameSay("Movie-night idea ready.");}
    function showGameLaugh(){var joke=gameJokes[gameLaughIndex%gameJokes.length];gameLaughIndex++;document.getElementById("gameWorkspace").innerHTML='<h3>Just for Laughs</h3><div class="game-idea">'+joke+'</div><button data-mr-action="showGameLaugh()">NEXT JOKE</button>';gameSay("Share the smile.");}
    function toggleGameBeat(){
      if(gameBeatTimer){stopGameBeat();gameSay("Music stopped.");return}
      var AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){gameSay("Music is not available on this device.");return}
      gameAudioContext=gameAudioContext||new AudioContext();var notes=[261.6,329.6,392,329.6],step=0;
      function tone(){var osc=gameAudioContext.createOscillator(),gain=gameAudioContext.createGain();osc.frequency.value=notes[step++%notes.length];gain.gain.setValueAtTime(.035,gameAudioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,gameAudioContext.currentTime+.22);osc.connect(gain);gain.connect(gameAudioContext.destination);osc.start();osc.stop(gameAudioContext.currentTime+.24)}
      tone();gameBeatTimer=setInterval(tone,420);document.getElementById("gameWorkspace").innerHTML='<h3>Music &amp; Dance</h3><p>A gentle playful beat is playing. Move however feels fun.</p><button data-mr-action="toggleGameBeat()">STOP MUSIC</button>';gameSay("Music started.");
    }
    function stopGameBeat(){if(gameBeatTimer){clearInterval(gameBeatTimer);gameBeatTimer=null}}
    function setGameMood(mood,announce){
      var shell=document.getElementById("gameShell");if(shell)shell.setAttribute("data-mood",mood);localStorage.setItem("meltdownGameMood",mood);
      if(announce!==false)gameSay((mood==="lantern"?"Lantern glow":mood==="quiet"?"Quiet mode":"Bright and playful")+" selected.");
    }
    function saveGameSetup(){var setup={mood:document.getElementById("gameShell").getAttribute("data-mood")||"bright",who:document.getElementById("gameWho").value,age:document.getElementById("gameAge").value,energy:document.getElementById("gameEnergy").value,place:document.getElementById("gamePlace").value,sensory:document.getElementById("gameSensory").value,time:document.getElementById("gameTime").value};localStorage.setItem("meltdownGameSetup",JSON.stringify(setup));gameSay("Your Family & Fun Room setup was saved on this device.");}
    function findGameActivity(){
      var who=document.getElementById("gameWho").value,energy=document.getElementById("gameEnergy").value,place=document.getElementById("gamePlace").value,sensory=document.getElementById("gameSensory").value,time=document.getElementById("gameTime").value,ideas=[];
      if(place==="Outdoor")ideas=["Playground adventure","Garden scavenger hunt","Creek and water-wheel walk"];else if(energy==="Quiet"||sensory==="Low Stimulation")ideas=["25-piece puzzle","Solitaire card challenge","Sudoku together"];else if(energy==="High Energy")ideas=["Darts challenge","Music and dance","Outdoor adventure"];else ideas=["Checkers match","Movie night","50-piece puzzle"];
      gameSuggestedIdea=ideas[0];document.getElementById("gameWorkspace").innerHTML='<h3>Activities for '+who+'</h3><div class="game-idea">'+ideas.join(" • ")+'<br><small>'+time+' • '+place+' • '+sensory+'</small></div><button data-mr-action="openSuggestedGame(gameSuggestedIdea)">START FIRST IDEA</button>';gameSay("Three blueprint-matched activities are ready.");
    }
    function openSuggestedGame(idea){if(idea.indexOf("Puzzle")>=0||idea.indexOf("puzzle")>=0)openGameTool("puzzle",25);else if(idea.indexOf("Solitaire")>=0)openGameTool("solitaire");else if(idea.indexOf("Sudoku")>=0)openGameTool("sudoku");else if(idea.indexOf("Darts")>=0)openGameTool("darts");else if(idea.indexOf("Music")>=0)openGameTool("music");else if(idea.indexOf("Outdoor")>=0||idea.indexOf("Playground")>=0||idea.indexOf("Garden")>=0||idea.indexOf("Creek")>=0)showScreen("explore");else if(idea.indexOf("Movie")>=0)openGameTool("movie");else openGameTool("checkers")}
    function getGameMemories(){try{return JSON.parse(localStorage.getItem("meltdownGameMemories")||"[]")}catch(error){return[]}}
    function saveGameMemory(){var area=document.getElementById("gameMemoryText"),text=area.value.trim();if(!text){document.getElementById("gameStatus").textContent="Write a memory first.";return}var items=getGameMemories();items.unshift({text:text,date:new Date().toISOString()});localStorage.setItem("meltdownGameMemories",JSON.stringify(items.slice(0,100)));area.value="";document.getElementById("gameStatus").textContent="Memory saved privately on this device."}
    function showGameMemories(){var items=getGameMemories(),box=document.getElementById("gameWorkspace");if(!items.length){box.innerHTML="<h3>Memory Library</h3><p>No memories saved yet.</p>";return}box.innerHTML="<h3>Memory Library</h3>"+items.map(function(item){return '<div class="game-idea"><strong>'+new Date(item.date).toLocaleDateString()+'</strong><br>'+gameEscape(item.text)+'</div>'}).join("")}
    function clearGameMemory(){document.getElementById("gameMemoryText").value="";document.getElementById("gameStatus").textContent="Writing cleared."}
    function gameEscape(value){var node=document.createElement("div");node.textContent=value||"";return node.innerHTML}

    function runGeneratedAction(action,control,event){
      action=String(action||"").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
      if(action.indexOf("celebrationStatus.textContent=")===0){celebrationStatus.textContent="You made room for joy today.";return true}
      var calls=action.split(";").filter(Boolean),ran=false;
      calls.forEach(function(call){var match=call.trim().match(/^([A-Za-z_$][\w$]*)\((.*)\)$/);if(!match||typeof window[match[1]]!=="function")return;
        var raw=match[2].trim(),args=[];
        if(raw){var parts=raw.match(/'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|[^,]+/g)||[];args=parts.map(function(part){part=part.trim();if(part==="true")return true;if(part==="false")return false;if(part==="null")return null;if(part==="this")return control;if(part==="event")return {currentTarget:control,target:event.target,clientX:event.clientX,clientY:event.clientY};if(part==="gameSuggestedIdea")return gameSuggestedIdea;if(/^[-+]?\d+(\.\d+)?$/.test(part))return Number(part);if((part[0]==="'"&&part.slice(-1)==="'")||(part[0]==='"'&&part.slice(-1)==='"'))return part.slice(1,-1).replace(/\\'/g,"'").replace(/\\"/g,'"');return part})}
        window[match[1]].apply(null,args);ran=true;
      });return ran;
    }
    document.addEventListener("click",function(event){
      var control=event.target.closest("[onclick],[data-mr-action]");if(!control)return;
      var action=control.getAttribute("onclick")||control.getAttribute("data-mr-action");
      control.setAttribute("data-mr-action",action);control.removeAttribute("onclick");
      if(runGeneratedAction(action,control,event))event.preventDefault();
    },true);

    var start = window.location.hash.replace("#", "");
    if (["retreat", "home", "entrance", "map", "great", "calm", "hope", "celebration", "learn", "resources", "explore", "game", "outdoor", "companion", "rant", "meltdown", "thinking", "axe", "plate", "crumple"].includes(start)) {
      showScreen(start);
    }

// The generated dartboard is a keyboard button as well as a pointer target.
document.addEventListener('keydown',function(event){
 var board=event.target.closest&&event.target.closest('.game-dartboard');
 if(!board||(event.key!=='Enter'&&event.key!==' '))return;
 event.preventDefault();var rect=board.getBoundingClientRect();
 throwGameDart({currentTarget:board,target:board,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2});
});
