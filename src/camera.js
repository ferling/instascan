function cameraName(label) {
  let clean = label.replace(/\s*\([0-9a-f]+(:[0-9a-f]+)?\)\s*$/, '');
  return clean || label || null;
}

class MediaError extends Error {
  constructor(type) {
    super(`Cannot access video stream (${type}).`);
    this.type = type;
  }
}

class Camera {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this._stream = null;
  }

  async start() {
    var DEVICES = [];
    var final = null;

    this._stream = await navigator.mediaDevices.enumerateDevices()
        .then(async function(devices) {

            var arrayLength = devices.length;
            for (var i = 0; i < arrayLength; i++)
            {
                var tempDevice = devices[i];
                if (tempDevice.kind == "videoinput")
                {
                    DEVICES.push(tempDevice);
                    if(tempDevice.facingMode == "environment" || tempDevice.label.indexOf("facing back")>=0 || tempDevice.label.indexOf('Back Camera')>=0 )
                        {final = tempDevice;}
                }
            }

            var totalCameras = DEVICES.length;
            //If couldnt find a suitable camera, pick the last one... you can change to what works for you
            if(final == null)
            {
                //console.log("no suitable camera, getting the first one");
                final = DEVICES[0];
            };

            //Set the constraints and call getUserMedia
            var constraints = {
            audio: false,
            video: {
                deviceId: {exact: final.deviceId}
                }
            };

            return await navigator.mediaDevices.getUserMedia(constraints);

        })
        .catch(function(err) {
            console.log(err.name + ": " + err.message);
    });

    return this._stream;
  }

  stop() {
    if (!this._stream) {
      return;
    }

    for (let stream of this._stream.getVideoTracks()) {
      stream.stop();
    }

    this._stream = null;
  }

  static async getCameras() {
    await this._ensureAccess();

    let devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(d => d.kind === 'videoinput')
      .map(d => new Camera(d.deviceId, cameraName(d.label)));
  }

  static async _ensureAccess() {
    return await this._wrapErrors(async () => {
      let access = await navigator.mediaDevices.getUserMedia({ video: true });
      for (let stream of access.getVideoTracks()) {
        stream.stop();
      }
    });
  }

  static async _wrapErrors(fn) {
    try {
      return await fn();
    } catch (e) {
      if (e.name) {
        throw new MediaError(e.name);
      } else {
        throw e;
      }
    }
  }
}

module.exports = Camera;
