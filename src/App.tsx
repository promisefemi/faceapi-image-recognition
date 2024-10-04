import {useCallback, useEffect, useRef, useState} from 'react'
import './App.css'
import Webcam from "react-webcam";
import * as faceApi from 'face-api.js'
import {FaceDetection, FaceLandmarks68, WithFaceDescriptor, WithFaceLandmarks} from "face-api.js";


function App() {
    const webCamRef = useRef(null);
    const canvasRef = useRef(null);


    const [baseImage, setImage] = useState<string>('');
    const [baseImageFileDescriptors, setBaseImageFileDescriptors] = useState<WithFaceDescriptor<WithFaceLandmarks<{
        detection: FaceDetection;
    }, FaceLandmarks68>>>()

    const [faceApiReady, setFaceApiReady] = useState<boolean>(false);
    const capturePhoto = async () => {
        if (webCamRef.current && faceApiReady) {
            const imageUrl = webCamRef.current.getScreenshot();
            setImage(imageUrl)
            const imageInput = await faceApi.fetchImage(imageUrl)
            const fileDescriptors = await faceApi.detectAllFaces(imageInput).withFaceLandmarks().withFaceDescriptors();
            console.log(fileDescriptors);
            if (fileDescriptors.length > 1) {
                alert("More than one person in camera frame")
                return
            }
            setBaseImageFileDescriptors(fileDescriptors[0])
        }
    }

    const testFaceMatch = async () => {
        if (webCamRef.current && faceApiReady && baseImageFileDescriptors) {
            const imageUrl = webCamRef.current.getScreenshot();
            const imageInput = await faceApi.fetchImage(imageUrl)
            const maxDescriptorDistance = 0.5
            const faceMatcher = new faceApi.FaceMatcher(baseImageFileDescriptors, maxDescriptorDistance)
            const fileDescriptors = await faceApi.detectAllFaces(imageInput).withFaceLandmarks().withFaceDescriptors();
            if (fileDescriptors.length > 1) {
                alert("More than one person in camera frame")
                return
            }

            const match = faceMatcher.findBestMatch(fileDescriptors[0].descriptor)

            if (match.distance >= maxDescriptorDistance) {
                console.log("Not the same person in base image")
            } else {
                console.log("THe same person")
            }
        }
    }

    useEffect(() => {
        setInterval(testFaceMatch, 1000)
    },[testFaceMatch])

    const initializeFaceApiModels = useCallback(async () => {

        await faceApi.loadFaceDetectionModel('/weights')
        await faceApi.loadFaceLandmarkModel('/weights')
        await faceApi.loadFaceRecognitionModel('/weights')
        setFaceApiReady(true);


        // const detectionResults = await faceApi.detectAllFaces(webCamRef.current.video)
        // console.log(detectionResults)
        // canvasRef.current.getContext('2d').drawImage(webCamRef.current.video, 0, 0, webCamRef.current.video.width, webCamRef.current.video.height)
        // faceApi.draw.drawDetections(canvasRef.current, detectionResults)

    }, [])


    useEffect(() => {
        initializeFaceApiModels();
    })


    return (
        <>

            <div className={""}>

                <table>
                    <tbody>
                    <tr>
                        <td>
                            <img src={baseImage} width={400} height={225}/>
                        </td>
                        <td>

                            <Webcam ref={webCamRef} width={800} height={450}/>
                            <button onClick={capturePhoto}
                                    disabled={!faceApiReady}>{faceApiReady ? "Take Reference Picture" : "Loading face api model..."}</button>
                            {baseImage &&
                                <button onClick={testFaceMatch}>validate image</button>
                            }
                        </td>
                    </tr>
                    </tbody>
                </table>


            </div>


        </>
    )
}

export default App
