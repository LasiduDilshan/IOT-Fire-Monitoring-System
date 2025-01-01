## Setup Instructions

1. **Update Configuration in `server.js`**  
   In the `server.js` file, make the following updates:
   - Update your **Twilio `accountSid`** and **`authToken`**.
   - Set the appropriate **MQTT topic** to subscribe to.
   - Update the **Twilio WhatsApp number**.

2. **Run the Backend**  
   Open a terminal window in the project directory and run the following command to start the backend server:

   ```bash
   node server.js
   ```

3. **Run the Frontend**  
   Open a second terminal window, navigate to the `sensor-ui` directory, and run the following command to start the frontend:

   ```bash
   cd sensor-ui
   npm run dev
   ```

4. **Access the Application**  
   Once the frontend is running, open your web browser and go to:

   ```
   http://localhost:5173/
   ```

   You can now interact with the application.

---

### Notes:

- **Normal Mode:**  
   After pressing the **"STOP WARNING"** or **"FORCED STOP"** buttons, you must press the **"NORMAL MODE"** button to resume normal operations.

---

This should provide clear instructions for setting up and running your project. Feel free to modify any details specific to your setup!
