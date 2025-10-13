import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import auteonLogo from '../assets/auteon-logo.jpg';

const LandingPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTo = urlParams.get('scrollTo');
    if (scrollTo === 'kontakt') {
      setTimeout(() => {
        const element = document.getElementById('kontakt');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Topbar / Navigation (angelehnt an auteon) */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={auteonLogo} alt="logo" className="h-6 w-auto rounded-full" />
            <div className="hidden md:flex items-center gap-4">
              <span className="font-bold text-gray-900">Werkstatt-Daten</span>
              <nav className="flex items-center gap-4 text-sm text-gray-700">
                <a href="#vorteile" className="hover:text-[color:var(--action-500)]">Vorteile</a>
                <a href="#anwendungen" className="hover:text-[color:var(--action-500)]">Anwendungen</a>
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#kontakt"><Button className="action-bg action-bg-hover text-white h-8">Jetzt Zugang zu Sample anfragen</Button></a>
            <Link to="/login"><Button variant="outline" className="text-[color:var(--action-500)] border-[color:var(--action-500)] hover:bg-[color:var(--action-500)] hover:text-white h-8">Login zu Sample-Daten</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero – grüne Teaserfläche wie auf auteon */}
      <section className="brand-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Alle Werkstätten, alle wichtigen Infos.
            <span className="block">Laufend aktualisiert und optimiert.</span>
          </h1>
          <p className="mt-5 text-white/90 text-lg max-w-3xl">
            Angereicherte Werkstatt-Daten mit über 50 Attributen aus über 40 Plattformen & Quellen,
            wöchentlich aktualisiert. Validiert und nutzbar in einer modernen Web‑App – für
            schnellere Entscheidungen und messbare Ergebnisse.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <a href="#kontakt">
              <Button className="action-bg action-bg-hover text-white text-base px-6 h-10">Jetzt Zugang zu Sample anfragen</Button>
            </a>
            <a href="/login" className="text-white underline-offset-4 hover:underline">Login vorhanden? Jetzt Sample-Daten entdecken.</a>
          </div>
        </div>
      </section>

      {/* Embed – ersetzt das Video/Teaser-Element der Referenzseite */}
      <section className="brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div style={{ position: 'relative', boxSizing: 'content-box', maxHeight: '80vh', width: '100%', aspectRatio: '1.5921985815602837', padding: '40px 0 40px 0' }}>
            <iframe
              src="https://demo.auteon.io/embed/cmgp2t6ga0gr612sxt1uf674d?embed_v=2&utm_source=embed"
              loading="lazy"
              title="Werkstattadressen-Sample"
              allow="clipboard-write"
              frameBorder="0"
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </section>

      {/* USPs (in Anlehnung an auteon-Aufbau) */}
      <section id="vorteile" className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-semibold heading-contrast mb-2">Intelligente Multi‑Source‑Konsolidierung</h3>
            <p className="text-gray-600">Automatisches Cross‑Source‑Matching, Konfliktauflösung bei abweichenden Angaben und strukturierte Validierungen (z. B. VAT‑IDs, Handelsregister).</p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-semibold heading-contrast mb-2">Höhere Datenqualität & Aktualität</h3>
            <p className="text-gray-600">Wöchentliche Aktualisierungen, Normalisierung & Format‑Checks für Kontaktfelder, Erreichbarkeits‑Prüfung von Websites und vollständige Geo‑Koordinaten.</p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-semibold heading-contrast mb-2">Export-ready</h3>
            <p className="text-gray-600">Sichere Exporte als JSON inkl. Metadaten. Ideal für Tests, Demos und Integrationen.</p>
          </div>
        </div>
      </section>

      {/* Vergleichstabelle */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold heading-contrast mb-6">Mehr Tiefe & Aktualität als andere Anbieter</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Kriterium</th>
                  <th className="text-left px-4 py-2 border-b">Gekaufte Adressen</th>
                  <th className="text-left px-4 py-2 border-b">Angereicherte Daten</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Datenfelder','<15 Basis-Informationen','>50 angereicherte Felder'],
                  ['Aktualität','>30% veraltet','Wöchentliche Prüfung'],
                  ['Telefonnummern','99,3%','100,0% (normalisiert & validiert)'],
                  ['E‑Mail‑Adressen','65,6%','100,0% (Format‑Validierung)'],
                  ['Websites','71,4%','99,5% (Erreichbarkeits‑Check)'],
                  ['GPS‑Koordinaten','❌','✅ 100,0% (DE‑Bereiche validiert)'],
                  ['Google‑Bewertungen','❌','✅ mit Ratings & Reviews'],
                  ['Services/Angebote','Nur „target_groups"','✅ detaillierte Services'],
                  ['Geschäftsdaten','❌','✅ sofern verfügbar'],
                  ['Gründungen/Wechsel','❌','✅ aktuelle Ereignisse'],
                ].map((row, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 border-b text-gray-700">{row[0]}</td>
                    <td className="px-4 py-2 border-b text-gray-500">{row[1]}</td>
                    <td className="px-4 py-2 border-b font-medium text-[color:var(--auteon-contrast-bg)]">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8">
            <a href="#kontakt"><Button className="action-bg action-bg-hover text-white">Jetzt Zugang zu Sample anfragen</Button></a>
          </div>
        </div>
      </section>

      {/* Anwendungen & Value */}
      <section id="anwendungen" className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold heading-contrast mb-6">Anwendungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold heading-contrast">Marketing & Vertrieb</h3>
              <p className="text-gray-600 mt-2">Service‑basierte Segmentierung, Geo‑Marketing, Qualitäts‑Targeting.</p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold heading-contrast">Marktanalyse</h3>
              <p className="text-gray-600 mt-2">Wettbewerbsvergleich, Marktpenetration, Trend‑Tracking.</p>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold heading-contrast">Lead‑Generierung</h3>
              <p className="text-gray-600 mt-2">Hohe Erreichbarkeit durch normalisierte Telefonnummern, validierte E‑Mails und geprüfte Websites.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Kontaktformular */}
      <section id="kontakt" className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold heading-contrast mb-4">Jetzt Zugang zu Sample anfragen</h2>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const payload = {
              name: form.name.value.trim(),
              company: form.company.value.trim(),
              email: form.email.value.trim(),
              message: form.message.value.trim()
            };
            const res = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
              alert('Vielen Dank! Wir melden uns zeitnah.');
              form.reset();
            } else {
              alert('Senden fehlgeschlagen. Bitte später erneut versuchen.');
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" required className="w-full border rounded-md px-3 py-2" placeholder="Max Mustermann" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
              <input name="company" className="w-full border rounded-md px-3 py-2" placeholder="Unternehmen GmbH" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input type="email" name="email" required className="w-full border rounded-md px-3 py-2" placeholder="vorname.nachname@firma.de" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
              <textarea name="message" rows={4} className="w-full border rounded-md px-3 py-2" placeholder="Optionale Nachricht an uns." />
            </div>
            <Button type="submit" className="action-bg action-bg-hover text-white">Anfrage absenden</Button>
          </form>
        </div>
      </section>

      {/* Footer wie auf anderen Seiten */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-4">
            <img src={auteonLogo} alt="auteon" className="h-6 rounded-full" />
            <span className="text-sm text-gray-500">© 2025 auteon.</span>
            <a href="https://www.auteon.com/rechtliches/impressum" target="_blank" rel="noopener noreferrer" className="text-sm text-[color:var(--action-500)] hover:underline">Impressum</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;