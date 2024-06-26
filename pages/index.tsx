import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount, useReadContract , useWriteContract } from 'wagmi';
import { FormEvent, useEffect, useState } from 'react';
import { Span } from 'next/dist/trace';
import contract from "../contract.json";
import { keccak256 } from 'js-sha3';

const Home: NextPage = () => {
  const account = useAccount()
  const [userAddress, setUserSAddress] = useState<String>("");
  const { writeContract } = useWriteContract()

  const [Name, setName] = useState<string>("");
  const [Hash, setFileHash] = useState<string>("");

  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorUpload, setErrorUpload] = useState<string | null>(null);
  const [errorUpdate, setErrorUpdate] = useState<string | null>(null);


  const { refetch } = useReadContract({
    abi: contract.abi,
    address: contract.addressFuji as `0x${string}`,
    functionName: 'verifyDocument',
    args: [Name, Hash, userAddress],
  })

  useEffect(() => {
    if(account.address){
      setUserSAddress(account.address);
      console.log({ account: account.address });
    }else{
      setUserSAddress("");
    }
  }, [account]); 

  const handleFileSelect = async () => {
    // Crear un input de tipo archivo en tiempo de ejecución
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && event.target.result instanceof ArrayBuffer) {
              const arrayBuffer = event.target.result;
              const hash = keccak256(new Uint8Array(arrayBuffer));
              setFileHash(hash);
            }
          };
          reader.readAsArrayBuffer(file);
        }
      }
    };
    input.click(); // Abre el diálogo de selección de archivo
  };

  const uploadDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name');
    const newType = formData.get('type');
    const newOwner = formData.get('owner');

    // Validación básica
    if (!newName || !newType || !Hash || !newOwner) {
      setErrorUpload("Todos los campos son obligatorios.");
        return;
    }
    try {
      const result = await writeContract({
        abi: contract.abi,
        address: contract.addressFuji as `0x${string}`,
        functionName: 'uploadNewDocument',
        args: [newName, newType, Hash, newOwner],
      });
      if (result === undefined) {
        throw new Error('Error al subir el documento o no estas autorizado');
      }
      alert('Documento subido exitosamente!');
      setErrorUpload(null); // Limpiar el mensaje de error
    } catch (error) {
      setErrorUpload((error as Error).message);
    }
  }

  const updateDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name');

    // Validación básica
    if (!newName || !Hash) {
      setErrorUpdate("Todos los campos son obligatorios.");
        return;
    }

    try {
        const result = await writeContract({ 
          abi: contract.abi,
          address: contract.addressFuji as `0x${string}`,
          functionName: 'updateDocument',
          args: [newName, Hash],
       });
       if (result === undefined) {
        throw new Error('Error al actualizar el documento o no estas autorizado');
      }
       alert('Documento actualizado exitosamente!');
       setErrorUpdate(null); // Limpiar el mensaje de error
    } catch (error) {
      setErrorUpdate((error as Error).message);
    }
  }

  const verifyDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newName = formData.get('name');
    setName(newName as string);

    if (!Name || !Hash) {
        setErrorMessage("Todos los campos son obligatorios para verificar un documento.");
        return;  // Detiene la función si los campos no están completos.
    }
    // Limpiar mensajes de error previos
    setErrorMessage(null);
    const result = await refetch(); 
    if (result.error) {
        setErrorMessage("Error: No eres el dueño del documento o no existe.");
        return;
    }
    else {
      if (result.data === true) {
        setVerificationResult("Documento verificado: Es el documento original.");
      }
      else {
        setVerificationResult("Documento verificado: El documento no es original.");
      }
    }
    
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>RainbowKit App</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        <ConnectButton />

        <h1>Document Storage</h1>
        <div>
  {userAddress !== "" && (
    <>
      <span>El usuario {userAddress} se ha conectado satisfactoriamente</span>

      <button onClick={handleFileSelect}>Selecciona un archivo</button>

        <div>
          <h1>Subir un archivo</h1>
          <form onSubmit={uploadDocument}>
              <div>
                  <label htmlFor="name">Nombre del Archivo:</label>
                  <input type="text" name="name" id="name" required />
              </div>
              <div>
                  <label htmlFor="type">Tipo del Archivo:</label>
                  <input type="text" name="type" id="type" required />
              </div>
              <div>
                  <label htmlFor="owner">Dueño del Archivo:</label>
                  <input type="text" name="owner" id="owner" required />
              </div>
              <button type="submit" disabled={!Hash}>Sube el archivo</button>
          </form>
          <div>
              {errorUpload && <div style={{ color: 'red' }}>{errorUpload}</div>}
          </div>
        </div>

        <div>
          <h1>Actualiza un documento</h1>
          <form onSubmit={updateDocument}>
            <div>
              <label htmlFor="docName">Nombre del Documento:</label>
              <input type="text" id="docName" name="name" required />
            </div>
            <button type="submit" disabled={!Hash}>Actualizar documento</button>
          </form>
          <div>
              {errorUpdate && <div style={{ color: 'red' }}>{errorUpdate}</div>}
          </div>
        </div>

        <div>
          <h1>Verifica un documento</h1>
          <form onSubmit={verifyDocument}>
              <div>
                  <label htmlFor="docName">Nombre del Documento:</label>
                  <input type="text" id="docName" name="name" required />
              </div>
              <button type="submit" disabled={!Hash}>Verificar Autenticidad</button>
          </form>
          <div>
              {verificationResult && <div>{verificationResult}</div>}
              {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
          </div>
          </div>
          </>
          )}
        </div>

      </main>
    </div>
  );
};

export default Home;
function setFileHash(hash: string) {
  throw new Error('Function not implemented.');
}

