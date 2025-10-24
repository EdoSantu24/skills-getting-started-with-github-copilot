document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: normalize activities to an object { name: details }
  function normalizeActivities(raw) {
    if (!raw) return {};
    // If already an object keyed by name, return as-is
    if (!Array.isArray(raw) && typeof raw === "object") return raw;

    // If it's an array, try to map elements that look like { name, ... }
    if (Array.isArray(raw)) {
      const byName = {};
      raw.forEach(item => {
        // support items like { name: "...", description: "...", participants: [...] }
        const name = item.name || item.title || item.id || JSON.stringify(item).slice(0, 12);
        byName[name] = {
          description: item.description || "",
          schedule: item.schedule || "",
          max_participants: item.max_participants || item.maxParticipants || (item.capacity || 0),
          participants: Array.isArray(item.participants) ? item.participants : []
        };
      });
      return byName;
    }

    return {};
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");

      if (!response.ok) {
        // Show helpful debug UI when backend returns an error
        activitiesList.innerHTML = `
          <p>Impossibile caricare le attività (status ${response.status}). Controlla il server o la rete.</p>
          <button id="load-sample-btn" class="debug-btn">Carica attività di esempio</button>
        `;
        console.error("Fetch /activities failed:", response.status, response.statusText);
        // Attach handler to load sample data for debugging
        const sampleBtn = document.getElementById("load-sample-btn");
        if (sampleBtn) {
          sampleBtn.addEventListener("click", () => renderActivities(getSampleActivities()));
        }
        return;
      }

      const raw = await response.json();

      // Debug log to inspect server payload (open DevTools → Console)
      console.log("Raw /activities response:", raw);

      // Normalize to canonical object form used by the renderer
      const activities = normalizeActivities(raw);

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep the placeholder at index 0)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // If no activities returned, show hint + sample option
      if (!activities || Object.keys(activities).length === 0) {
        activitiesList.innerHTML = `
          <p>Nessuna attività disponibile al momento.</p>
          <button id="load-sample-btn" class="debug-btn">Carica attività di esempio</button>
        `;
        const sampleBtn = document.getElementById("load-sample-btn");
        if (sampleBtn) sampleBtn.addEventListener("click", () => renderActivities(getSampleActivities()));
        return;
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // Ensure participants is always an array to avoid runtime errors
        details.participants = Array.isArray(details.participants) ? details.participants : [];

        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = (details.max_participants || 0) - details.participants.length;

        // Always render a participants <ul>; show a "no participants" li when empty
        const participantsHTML = `<div class="participants">
               <h5 class="participants-title">Participants</h5>
               <ul class="participants-list no-bullets">
                 ${
                   details.participants && details.participants.length > 0
                     ? details.participants
                         .map(
                           p =>
                             `<li><span class="participant-name">${p}</span> <button class='delete-btn' data-activity='${encodeURIComponent(
                               name
                             )}' data-participant='${p}' aria-label='Unregister ${p}' title='Unregister'>🗑️</button></li>`
                         )
                         .join("")
                     : `<li class="no-participants">No participants yet</li>`
                 }
               </ul>
             </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = `
        <p>Errore di rete o JavaScript: impossibile caricare le attività.</p>
        <button id="load-sample-btn" class="debug-btn">Carica attività di esempio</button>
      `;
      console.error("Error fetching activities:", error);
      const sampleBtn = document.getElementById("load-sample-btn");
      if (sampleBtn) sampleBtn.addEventListener("click", () => renderActivities(getSampleActivities()));
    }
  }

  // Render activities from a given object (reuse same rendering used above)
  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    // Reset select
    while (activitySelect.options.length > 1) activitySelect.remove(1);

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML = `<div class="participants">
             <h5 class="participants-title">Participants</h5>
             <ul class="participants-list">
               ${
                 details.participants && details.participants.length > 0
                   ? details.participants
                       .map(
                         p =>
                           `<li>${p} <button class='delete-btn' data-activity='${encodeURIComponent(
                             name
                           )}' data-participant='${p}' aria-label='Unregister ${p}' title='Unregister'>🗑️</button></li>`
                       )
                       .join("")
                   : `<li class="no-participants">No participants yet</li>`
               }
             </ul>
           </div>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        ${participantsHTML}
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Sample data for local/debug rendering
  function getSampleActivities() {
    return {
      "Robotics Club": {
        description: "Build and program robots.",
        schedule: "Wednesdays 3:30-5:00pm",
        max_participants: 20,
        participants: ["alice@mergington.edu", "bob@mergington.edu"]
      },
      "Photography": {
        description: "Learn photography techniques.",
        schedule: "Mondays 4:00-5:30pm",
        max_participants: 12,
        participants: []
      }
    };
  }

  // Event delegation for delete buttons inside activities list
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;

    const participant = btn.getAttribute("data-participant");
    const activity = decodeURIComponent(btn.getAttribute("data-activity"));

    // Optionally confirm with the user
    if (!confirm(`Unregister ${participant} from "${activity}"?`)) return;

    try {
      // Call backend to unregister (adjust endpoint/method if your API differs)
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(participant)}`,
        { method: "POST" }
      );

      const result = await resp.json();
      if (resp.ok) {
        messageDiv.textContent = result.message || "Unregistered successfully";
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Function to refresh participants list in the UI
  function refreshParticipants(activityCard, participants) {
    const participantsList = activityCard.querySelector(".participants-list");
    if (!participantsList) return;

    if (!participants || participants.length === 0) {
      participantsList.innerHTML = `<li class="no-participants">No participants yet</li>`;
    } else {
      participantsList.innerHTML = participants
        .map(
          participant =>
            `<li>${participant} <button class='delete-btn' data-activity='${encodeURIComponent(
              activityCard.querySelector("h4").textContent
            )}' data-participant='${participant}' aria-label='Unregister ${participant}' title='Unregister'>🗑️</button></li>`
        )
        .join("");
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      // Keep the base "message" class for consistent styling
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities and select so participants and availability update
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
