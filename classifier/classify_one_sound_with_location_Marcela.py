# -*- coding: utf-8 -*-
"""
Created on Thu Apr 25 17:04:02 2019

@author: jessi
Example of use:--input-file ./prueba1/teclado_ISSA_63_2019-04-25T08_33_54.975Z_sp.wav --xCoor 0.6052 --yCoor -0.5411 --zCoor 0.5828
"""

import os
import argparse 

import numpy as np
from scipy.io import wavfile 
from hmmlearn import hmm
from python_speech_features import mfcc
from sklearn.externals import joblib

# Function to parse input arguments
def build_arg_parser():
    parser = argparse.ArgumentParser(description='Trains the HMM classifier')
    parser.add_argument("--input-file", dest="input_file", required=True,
            help="Input file to evaluate ")
    parser.add_argument("--xCoor", dest="xCoor", required=True,
            help="X Coordinate ")
    parser.add_argument("--yCoor", dest="yCoor", required=True,
            help="Y Coordinate ")
    parser.add_argument("--zCoor", dest="zCoor", required=True,
            help="Z Coordinate ")
    return parser

# Class to handle all HMM related processing
class HMMTrainer(object):
    def __init__(self, model_name='GaussianHMM', n_components=4, cov_type='diag', n_iter=1000):
        self.model_name = model_name
        self.n_components = n_components
        self.cov_type = cov_type
        self.n_iter = n_iter
        self.models = []

        if self.model_name == 'GaussianHMM':
            self.model = hmm.GaussianHMM(n_components=self.n_components, 
                    covariance_type=self.cov_type, n_iter=self.n_iter)
        else:
            raise TypeError('Invalid model type')

    # X is a 2D numpy array where each row is 13D
    def train(self, X):
        np.seterr(all='ignore')
        self.models.append(self.model.fit(X))

    # Run the model on input data
    def get_score(self, input_data):
        return self.model.score(input_data)

if __name__=='__main__':
    args = build_arg_parser().parse_args()
    input_file = args.input_file
    xCoor = args.xCoor
    yCoor = args.yCoor
    zCoor = args.zCoor
    
    hmm_models = joblib.load("./classifier/2019-Sonidos-Marcela-v1.pkl") 
    
    dictLocations = {
        "AGITAR_MEDICAMENTO": [np.array([0.151,	0.546,	0.816]),0.25],
        "ASPIRAR": [np.array([-0.449,0.150,0.872]),0.25],
        "CAMPANA_ESTUFA": [np.array([0.626,0.250,0.738]),0.25],
        "LAVAR_TRASTES": [np.array([0.505,0.490,0.711]),0.25],
        "LICUADORA": [np.array([0.599,0.482,0.638]),0.25],
    }
    
    
    LocCoorThisSound = np.array([float(xCoor),float(yCoor),float(zCoor)])
    
    sampling_freq, audio = wavfile.read(input_file)
    # Extract MFCC features
    mfcc_features = mfcc(audio, sampling_freq)

    # Define variables
    max_score = -99999
    output_label = None

    for item in hmm_models:
        hmm_model, label = item
        score = hmm_model.get_score(mfcc_features)
        if score > max_score:
            max_score = score
            output_label = label
            
    predictedClass = output_label.split('\\')
    # Print the output
    if np.linalg.norm((dictLocations[predictedClass[-1]][0])-LocCoorThisSound)<=dictLocations[predictedClass[-1]][1]:
        if max_score>=-30000:
            print ("Predicted:", predictedClass[-1] )
        elif max_score<-30000 and max_score>-32000:
            print ("Was that a", predictedClass[-1] )
        else:
            print ("What was that?")
    else:
         print ("What was that?")










