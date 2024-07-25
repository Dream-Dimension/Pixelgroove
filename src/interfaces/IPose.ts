import { type Keypoint } from '@tensorflow-models/posenet';

export const BODY_PARTS = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'];

export interface IKeyPoint extends Omit<Keypoint, 'score'> {
  probability: number
};

interface IPose {
  keypoints: IKeyPoint[]
  probability: number
};

export default IPose;
/*
[
    {
        "score": 0.99876868724823,
        "part": "nose",
        "position": {
            "x": 377.06996209535885,
            "y": 142.01995056533022
        }
    },
    {
        "score": 0.9944422841072083,
        "part": "leftEye",
        "position": {
            "x": 377.2302398443594,
            "y": 137.59521500236528
        }
    },
    {
        "score": 0.9940979480743408,
        "part": "rightEye",
        "position": {
            "x": 366.7352444296136,
            "y": 136.0291821644361
        }
    },
    {
        "score": 0.16534358263015747,
        "part": "leftEar",
        "position": {
            "x": 382.7805226604206,
            "y": 143.2178100776276
        }
    },
    {
        "score": 0.979213297367096,
        "part": "rightEar",
        "position": {
            "x": 348.452200093619,
            "y": 143.1469209476717
        }
    },
    {
        "score": 0.9969757795333862,
        "part": "leftShoulder",
        "position": {
            "x": 398.2286283638846,
            "y": 181.68186822205226
        }
    },
    {
        "score": 0.9942276477813721,
        "part": "rightShoulder",
        "position": {
            "x": 330.0041063043889,
            "y": 180.00922260562
        }
    },
    {
        "score": 0.9812276363372803,
        "part": "leftElbow",
        "position": {
            "x": 428.6841567778922,
            "y": 212.4844106170591
        }
    },
    {
        "score": 0.9296307563781738,
        "part": "rightElbow",
        "position": {
            "x": 318.561458498379,
            "y": 235.69221068320803
        }
    },
    {
        "score": 0.37711799144744873,
        "part": "leftWrist",
        "position": {
            "x": 395.69019668745733,
            "y": 210.05327807642567
        }
    },
    {
        "score": 0.038946885615587234,
        "part": "rightWrist",
        "position": {
            "x": 329.4660437906774,
            "y": 265.0649255129999
        }
    },
    {
        "score": 0.18898463249206543,
        "part": "leftHip",
        "position": {
            "x": 387.29546676373894,
            "y": 268.8328387286212
        }
    },
    {
        "score": 0.49971774220466614,
        "part": "rightHip",
        "position": {
            "x": 339.0893004799782,
            "y": 273.4245719037284
        }
    },
    {
        "score": 0.014349287375807762,
        "part": "leftKnee",
        "position": {
            "x": 381.39544506340803,
            "y": 295.45788517117256
        }
    },
    {
        "score": 0.0020073172636330128,
        "part": "rightKnee",
        "position": {
            "x": 337.94652477627426,
            "y": 329.86174680586913
        }
    },
    {
        "score": 0.01030492689460516,
        "part": "leftAnkle",
        "position": {
            "x": 385.7399708097699,
            "y": 327.7386541227789
        }
    },
    {
        "score": 0.0082737747579813,
        "part": "rightAnkle",
        "position": {
            "x": 334.11121933768953,
            "y": 389.69012754127044
        }
    }
]
*/
