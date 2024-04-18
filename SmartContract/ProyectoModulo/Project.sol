// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProjectDocumentStorage {
    address public owner;

    // Definimos la estructura que tendra un documento
    struct Document {
        string docType;
        string documentHash;
        address documentOwner;
    }

    mapping(string => Document) private documents; // Mapping para almacenar los documentos
    mapping(address => bool) private whitelist; // Mapping para almacenar esos usarios que hacen parte de la whitelist


    constructor(){
        owner = msg.sender; // Definimos quien es el owner de este contrato inteligente
        whitelist[msg.sender] = true; // Agregamos al owner como integrante de la whitelist
    }

    // Agregamos el requisito para que solo el propietario pueda realizar algunas acciones
    modifier onlyOwner {
        require(msg.sender == owner, "Solo el propietario puede realizar esta accion");
        _;
    }

    // Agregamos el requisito para que solo quienes hagan parte de la whitelist puedan realizar algunas acciones
    modifier onlyWhiteList {
        require(whitelist[msg.sender] == true, "No estas autorizado para realizar esta accion");
        _;
    }

    // Funciones para el manejo de la whitelist --------------------------------------------------------------

    function addMemberToWhiteList (address newMember) external onlyOwner {
        whitelist[newMember] = true;
    }

    function delMemberToWhiteList (address member) external onlyOwner {
        whitelist[member] = false;
    }
     // ------------------------------------------------------------------------------------------------------

    // Funcion para subir un nuevo documento

    function uploadNewDocument(string memory _name, string memory _docType, string memory _documentHash, address _documentOwner) public onlyWhiteList {
        Document memory newDocument = Document(_docType, _documentHash, _documentOwner);

        documents[_name] = newDocument;
    }

    // Funcion para actualizar un documento

    function updateDocument(string memory name, string memory newHash) external onlyWhiteList {
        documents[name].documentHash = newHash;
    }

    // Funcion para actualizar el dueño de un documento

    function updateDocumentOwner(string memory name, address newOwner) external onlyWhiteList {
        documents[name].documentOwner = newOwner;
    }

    // Funcion para verificar la autenticidad de un documento

    function verifyDocument(string memory name, string memory hashToVerify, address docOwner) external view returns (bool) {
        require(documents[name].documentOwner == docOwner, "No eres el propietario de este documento");
        // Comparamos los hashes del documento almacenado y el que se recibe

        return keccak256(abi.encodePacked(documents[name].documentHash)) == keccak256(abi.encodePacked(hashToVerify));
    }
}