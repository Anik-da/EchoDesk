# EchoDesk — Third Party Model Notices & Licensing

EchoDesk uses real local AI models optimized by Qualcomm AI Hub for local edge execution.

---

## 1. YOLOX-Small (Vision Model)

- **Model Name:** YOLOX-Small (`Yolo-X`)
- **Source:** Qualcomm AI Hub (Hugging Face: [qualcomm/Yolo-X](https://huggingface.co/qualcomm/Yolo-X))
- **Version:** v0.63.0 (Tool Versions: QAIRT `2.50.0`, ONNX Runtime `1.27.1`)
- **Artifact Location:** `models/vision/yolox/yolox.onnx`
- **Intended Use:** On-device camera frame object detection to classify human workstation presence (`PERSON_PRESENT`, `MULTIPLE_PEOPLE`, `NO_PERSON`).
- **Distribution Status:** Distributed / Downloaded under the terms of the Apache License, Version 2.0.

### License Text: Apache License 2.0

```text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 2. YAMNet (Audio Model)

- **Model Name:** YAMNet (`YamNet`)
- **Source:** Qualcomm AI Hub (Hugging Face: [qualcomm/YamNet](https://huggingface.co/qualcomm/YamNet))
- **Version:** v0.63.0 (Tool Versions: QAIRT `2.50.0`, ONNX Runtime `1.27.1`)
- **Artifact Location:** `models/audio/yamnet/yamnet.onnx`
- **Intended Use:** On-device short audio buffer classification for environmental acoustic events (`SPEECH_ACTIVITY`, `MUSIC`, `BACKGROUND_NOISE`, `SILENCE`).
- **Distribution Status:** Distributed / Downloaded under the terms of the MIT License.

### License Text: MIT License

```text
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Privacy Policy Compliance Notice
All model execution occurs **100% locally on-device**. No raw camera frames or audio samples are ever written to disk, transcribed, or transmitted outside the host device.
