const {app, BrowserWindow, Tray, nativeImage} = require('electron');
const helper = require('./HelperFunctions.js');
const path = require('path');

class WindowManager {
  constructor() {
    //Iconpaht different in Build
    let imgPath = helper.isDev() ? './Assets/Icon.png' : path.join(process.resourcesPath, 'Icon.png');
    this.icon = nativeImage.createFromPath(imgPath);
  }

  //Creates a Tray and a Windows
  createUI() {
    if (process.platform == "darwin")
      app.dock.hide();
    this.createTray();
    this.createMainWindow();
  }

  createTray() {
    this.tray = new Tray(this.icon);
    this.tray.on('click', this.toggleWindowMain.bind(this));

    if (process.platform == "darwin") 
      this.tray.setIgnoreDoubleClickEvents(true); //Better UX on MacOS
  }

  createMainWindow() {
    this.win = new BrowserWindow({
      width: 250,
      height: 435,
      frame: false,
      show: false,
      fullscreenable: false,
      movable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        plugins: true
      },
      skipTaskbar: true
    })

    this.win.loadFile('index.html');
    this.win.setVisibleOnAllWorkspaces(true);

    //When closing Windows
    this.win.on('closed', () => {
      this.win = null
    })
  }

  getWindowPosition() {
    const windowBounds = this.win.getBounds()
    const trayBounds = this.tray.getBounds()

    let x = 0;
    let y = 0;

    //MacOS
    if (process.platform != "win32") {
      // Center window horizontally below the tray icon
      x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
      // Position window 4 pixels vertically below the tray icon
      y = Math.round(trayBounds.y + trayBounds.height + 4)

      return {
        x: x,
        y: y
      }
    }
    //On Windows the Task bar is sadly very flexible
    else {
      if (trayBounds.y < 250) {
        x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
        y = Math.round(trayBounds.y + trayBounds.height + 4)
      } else if (trayBounds.x < 250) {
        x = Math.round(trayBounds.x + trayBounds.height * 2);
        y = Math.round(trayBounds.y - windowBounds.height + trayBounds.height)
      } else if (trayBounds.height >= 40) {
        x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
        y = Math.round(trayBounds.y - windowBounds.height)
      } else {
        x = Math.round(trayBounds.x - windowBounds.width);
        y = Math.round(trayBounds.y - windowBounds.height + trayBounds.height)
      }
      return {
        x: x,
        y: y
      }
    }
  }

  showMainWindow() {
    const position = this.getWindowPosition();
    this.win.setPosition(position.x, position.y);
    this.win.show()
    this.win.focus()

    //This is necessary for the window to appear on windows
    if (process.platform == "win32") {
      this.win.moveTop();
    }
  }


  toggleWindowMain() {
    //This triggers if the window is visible but occluded
    if (!this.win.isFocused() && this.win.isVisible()) {
      this.showMainWindow();
      return;
    }
    if (this.win.isVisible()) {
      this.win.hide()
    } else {
      this.showMainWindow();
    }
  }
}

module.exports = WindowManager;