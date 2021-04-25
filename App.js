'use strict';

import React, {useRef, useState, useEffect} from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  View,
  Modal,
} from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const emptyResponse = {
    nim: null,
    nama: null,
    jaket: null,
    sudah_ambil: null,
    pesan: null,
    updated_at: null,
  };

  const scannerRef = useRef(null);
  const [address, setAddress] = useState('192.168.100.58:5050');
  const [scan, setScan] = useState(false);
  const [responseObj, setresponseObj] = useState(emptyResponse);

  const [modalVisible, setModalVisible] = useState(false);

  const storeData = async value => {
    try {
      await AsyncStorage.setItem('@storage_Key', value);
      console.log('stored to local storage');
    } catch (e) {
      // saving error
    }
  };

  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('@storage_Key');
      if (value !== null) {
        console.log('Storage is not null');
        // value previously stored
        setAddress(value);
      } else {
        console.log('Storage is null');
      }
    } catch (e) {
      // error reading value
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const activateScanner = () => {
    setScan(true);
    //Save address to async storage
    storeData(address);
  };

  const closeModal = () => {
    setModalVisible(false);
    scannerRef.current.reactivate();
    if (responseObj.nim == null) {
      console.log('nim is undefined, do nothing');
    }
    //if not sudah absen then do axios absen
    if (responseObj.sudah_ambil == 0 && responseObj.nim != null) {
      axios
        .put(`http://${address}/api/absen/${responseObj.nim}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(res => {});
    }
  };

  const onSuccess = e => {
    axios
      .get(`http://${address}/api/fetch/${e.data}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        console.log(res);
        console.log(modalVisible);
        if (res.data.response == null) {
          setresponseObj(emptyResponse);
        } else {
          setresponseObj(res.data.response);
        }

        setModalVisible(true);
      });
  };

  return !scan ? (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setAddress}
        value={address}
      />
      <TouchableOpacity
        style={styles.buttonTouchable}
        onPress={() => activateScanner()}>
        <Text style={styles.buttonText}>Start Scan</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>NIM : {responseObj.nim}</Text>
            <Text style={styles.modalText}>NAMA : {responseObj.nama}</Text>
            <Text style={styles.modalText}>JAKET : {responseObj.jaket}</Text>
            <Text style={styles.modalText}>HARI : {responseObj.hari}</Text>
            <Text style={styles.modalText}>
              KETERANGAN : {responseObj.keterangan}
            </Text>

            {responseObj.sudah_ambil != 0 && (
              <Text style={styles.sudahAmbil}>
                SUDAH AMBIL PADA{' '}
                {new Date(responseObj.updated_at).toLocaleDateString()}
                {'\n'}
                {new Date(responseObj.updated_at).toLocaleTimeString()}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.buttonTouchable, {width: 200}]}
              onPress={() => {
                closeModal();
              }}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <QRCodeScanner
        onRead={onSuccess}
        ref={scannerRef}
        // reactivate={true}
        // reactivateTimeout={3000}
        showMarker={true}
        topContent={
          <>
            <Text style={styles.centerText}>Terkoneksi ke {address}</Text>
          </>
        }
        bottomContent={
          <>
            <TouchableOpacity
              style={styles.buttonTouchable}
              onPress={() => {
                setScan(false);
                setModalVisible(false);
                scannerRef.current.reactivate();
              }}>
              <Text style={styles.buttonText}>STOP</Text>
            </TouchableOpacity>
          </>
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonTouchable: {
    padding: 16,
    backgroundColor: '#4290f5',
    borderRadius: 20,
    width: '50%',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    fontSize: 20,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  sudahAmbil: {
    marginBottom: 15,
    fontSize: 20,
    textAlign: 'left',
    alignSelf: 'flex-start',
    backgroundColor: '#ffadad',
  },
  input: {
    width: '80%',
    borderRadius: 20,
    fontSize: 20,
    borderWidth: 2,
    borderColor: '#666666',
    padding: 10,
    marginBottom: 20,
  },
});

export default App;
