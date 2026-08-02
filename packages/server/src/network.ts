import { networkInterfaces } from 'node:os';
import QRCode from 'qrcode';

/**
 * Renvoie la première IPv4 locale non-interne trouvée (celle du réseau WiFi
 * auquel les téléphones des joueurs doivent être connectés). Lève une erreur
 * explicite si aucune n'est trouvée plutôt que de laisser QR code pointer
 * vers localhost, ce qui ne fonctionnerait que depuis l'ordinateur hôte.
 */
export function getLocalIPv4(): string {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  throw new Error(
    "Aucune adresse IP locale trouvée. Vérifie que l'ordinateur est bien connecté au réseau WiFi local."
  );
}

export function buildJoinUrl(port: number, path = '/play'): string {
  const ip = getLocalIPv4();
  return `http://${ip}:${port}${path}`;
}

/** Génère le QR code du lien de participation, encodé en data URL (PNG base64). */
export async function generateJoinQrCode(port: number, path = '/play'): Promise<{ url: string; qrCodeDataUrl: string }> {
  const url = buildJoinUrl(port, path);
  const qrCodeDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
  return { url, qrCodeDataUrl };
}
