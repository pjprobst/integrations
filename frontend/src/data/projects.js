import dentalConnectImage from './dentalconnect.png';
import offlineIndiaImage from './offlineindia.png';


const projects = [
    {
        title: 'DentalConnect',
        status: 'Done',
        image: dentalConnectImage,
        description: 'Dashboard with a CNN image model fine-tuned on a Kaggle dataset that classifies oral diseases with 87% accuracy.',
        technologies: ['React', 'FastAPI', 'MongoDB', 'Auth0', 'AWS SageMaker', 'Python', 'PyTorch'],
        links: [
          {
            label: 'Demo Video',
            href: 'https://www.youtube.com/watch?v=5Lp1jlsOOls'
          },
          {
            label: 'Devpost',
            href: 'https://devpost.com/software/dentalconnect-qc9ejr'
          }
        ]
    },
    {
        title: 'Smart Fridge Module',
        status: 'Done',
        description: 'Device with a touchscreen, barcode scanner, and a local RasPi server that lets users log food and index unrecognized items.',
        technologies: ['ESP32', 'C', 'libcurl', 'SQLite', 'Python', 'Raspberry Pi'],
    },
    {
        title: 'Offline India',
        status: 'Done',
        image: offlineIndiaImage,
        description: 'Offline-first site with resources and maps to aid during internet shutdowns in India. Supported by a 46 page paper made alongside local experts.',
        technologies: ['React', 'Node.js', 'Service Workers', 'IndexedDB', 'Cache API', 'Leaflet'],
    }
];

export default projects;