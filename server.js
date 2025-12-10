import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { getWindDirection, getWindSpeed, getWindGusts } from "./getMeteo.js";
import { getWaveHeight } from "./getWaveHeight.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', async (req, res) => {
    try {
        const windSpeed = await getWindSpeed();
        const windDirection = await getWindDirection();
        const waveHeight = await getWaveHeight();
        const windGusts = await getWindGusts();
        

        res.json({
            windSpeed,
            windDirection,
            waveHeight,
            windGusts
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// serve public folder as static
app.use(express.static(path.join(__dirname, 'public')));

app.get('/waves', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'waves.html'));
});

app.get('/waves2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'waves2.html'));
});

app.get('/cais', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cais.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});