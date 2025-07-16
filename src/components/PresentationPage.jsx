export default function PresentationPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-fuchsia-50 to-slate-50 py-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full px-8 py-12">

        {/* Title */}
        <div>
          <h1 className="text-4xl font-extrabold text-fuchsia-700 text-center">
            Secure Translation in Secluded Environments
          </h1>
          <p className="text-lg text-slate-700 text-center mt-3">
            Local AI for Home Office, Agencies &amp; Defense
          </p>
        </div>
        <br /><br /><br /><br />

        {/* Why Local, Secure Translation? */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            Why Local, Secure Translation?
          </h2>
          <ul className="list-disc ml-6 text-lg leading-relaxed mt-3 text-slate-800">
            <li><b>Zero data leakage:</b> All language and speech data stays in the secure zone.</li>
            <li><b>No cloud or SaaS:</b> Air-gapped and critical infra don't permit external APIs.</li>
            <li><b>Browser-native AI:</b> Offline, real-time translation and ASR. No roundtrips.</li>
          </ul>
        </div>
        <br /><br /><br /><br />

        {/* Technical Solution */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            Technical Solution
          </h2>
          <ul className="list-disc ml-6 text-lg mt-3 text-slate-800">
            <li><b>Isolated AWS S3 Hosting:</b> Models are stored in private S3 buckets in isolated VPCs—accessible from secure devices only.</li>
            <li><b>Transformers.js in Browser:</b> All inference is on the device; models load once and never require the cloud.</li>
          </ul>
        </div>
        <br /><br /><br /><br />

        {/* Secure System Overview */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            Secure System Overview
          </h2>
          <div className="flex gap-14 mt-6 justify-center flex-wrap">
            <div className="flex flex-col items-center">
              <svg width="90" height="90" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="18" width="60" height="40" rx="10" fill="#c7d2fe" stroke="#6366f1" strokeWidth="5"></rect>
                <rect x="28" y="36" width="32" height="15" rx="4" fill="#fef9c3" stroke="#f59e42" strokeWidth="2"></rect>
                <text x="44" y="48" fontSize="11" textAnchor="middle" fill="#a16207" fontWeight="bold">S3</text>
                <text x="45" y="78" fontSize="11" textAnchor="middle" fill="#4b5563">Isolated VPC</text>
              </svg>
              <span className="text-xs text-slate-500 text-center max-w-[80px] mt-1">
                Models stored in private AWS S3, without public internet.
              </span>
            </div>
            <div className="flex flex-col items-center">
              <svg width="90" height="90" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="18" width="60" height="40" rx="10" fill="#f0f9ff" stroke="#06b6d4" strokeWidth="5"></rect>
                <circle cx="45" cy="38" r="11" fill="#a5b4fc" stroke="#7c3aed" strokeWidth="2"></circle>
                <rect x="34" y="53" width="22" height="10" rx="4" fill="#bae5fd" stroke="#06b6d4" strokeWidth="1"></rect>
                <text x="45" y="42" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#3730a3">AI</text>
                <text x="45" y="80" fontSize="11" textAnchor="middle" fill="#4b5563">Browser</text>
              </svg>
              <span className="text-xs text-slate-500 text-center max-w-[80px] mt-1">
                Models run fully in-browser; data never leaves device.
              </span>
            </div>
          </div>
        </div>
        <br /><br /><br /><br />

        {/* Security Benefits */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            Security Benefits
          </h2>
          <ul className="list-disc ml-6 text-lg leading-relaxed mt-3 text-slate-800">
            <li><b>No cloud required:</b> System is offline after initial setup.</li>
            <li><b>Compliant with gov/defense mandates:</b> No exfiltration risk by design.</li>
            <li><b>Audit-friendly:</b> All language tasks run locally.</li>
          </ul>
        </div>
        <br /><br /><br /><br />

        {/* Use Cases */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            Use Cases
          </h2>
          <ul className="list-disc ml-6 text-lg leading-relaxed mt-3 text-slate-800">
            <li><b>Interview and forensics:</b> Real-time speech-to-text, translation, redaction with full security.</li>
            <li><b>Field ops:</b> Instant translation/ASR even when cut off from the network.</li>
            <li><b>Secure document review:</b> Use on-premise translation, summarization, or redaction at maximum privacy.</li>
          </ul>
        </div>
        <br /><br /><br /><br />

        {/* More Apps */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700">
            More Apps with Hugging Face Transformers.js
          </h2>
          <div className="flex flex-col items-center mt-3">
            <img
              src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
              alt="Hugging Face logo"
              className="h-14 my-2"
              style={{ filter: "drop-shadow(0 0 3px #fde68a)" }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <p className="text-center text-slate-600 text-base mt-2">
              Summarization, sentiment, translation, entity extraction, and more—all possible via browser-based inference.<br />
              Extendable for vision (blurring), moderation, and more.
            </p>
          </div>
        </div>
        <br /><br /><br /><br />

        {/* Final Block */}
        <div>
          <h2 className="text-2xl font-bold text-fuchsia-700 text-center">
            PA Consulting Makes it Real
          </h2>
          <p className="text-slate-700 max-w-xl mx-auto text-lg mt-4 text-center">
            Deploy modern AI—translation, speech-to-text, redaction—where data privacy must never be compromised.<br/>
            <span className="text-fuchsia-700 font-semibold">
              Designed for confidence in isolation.
            </span>
          </p>
          <span className="inline-block bg-fuchsia-100 text-fuchsia-900 rounded-xl px-5 py-3 font-semibold mt-6">
            Innovation for secure environments
          </span>
        </div>
        <br /><br /><br /><br />

      </div>
    </div>
  );
}
