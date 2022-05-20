# Frontend-Development

## Creating Frontend and Backend 

### Backend:
1. Create a folder called `flask-server`
2. Create a file named `server.py`, this file will server as the file to create all the necessary routings and APIs 
3. Create a virtual environment, `py -m venv venv`. To activate the virtual environment to install packages, `venv\Scripts\activiate`
4. Install flask server using `pip install flask`
5. Choose a python interpreter. Press CTRL SHIFT P to open up python interpreter and choose the python interpreter located in the venv folder 
6. To run the server, type `py server.py`(server.py is the name of the file)
7. Proceed to localhost:5000 to access the backend

### Frontend:
1. Create react client, `npx create-react-app client`
2. Remove some unnessary files: `App.test.js`, `index.js`, `logo.svg`
3. Create a proxy to connect frontend to the backend by navigating to the package.json file and entering the following line before dependencies: `"proxy": "http://localhost:5000"`
4. To start the frontend, navigate to the client folder and run `npm start`
5. Note that in order for the backend information to be displayed on the front end, the server has to be start up as well
