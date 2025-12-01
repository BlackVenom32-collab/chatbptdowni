import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Send, Smartphone, SmartphoneNfc, Battery, Wifi, ShieldAlert, Code, Pizza, Zap, Briefcase, Lock, Unlock, Skull, Terminal, AlertTriangle } from 'lucide-react';

// --- Configuration ---
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SUPERVISORS = ["Frau Ley", "Herr Raunig", "Herr Auer", "Herr Schoblick"];
const TASKS = [
    "Datenbank Migration fixen",
    "CSS Center Div fixen",
    "API Endpoint 'getLunch' bauen",
    "Legacy Code refactorn",
    "Unit Tests schreiben (würg)",
    "Doku schreiben (nein danke)",
    "React Hooks debuggen"
];

const App = () => {
  // --- Game State ---
  const [messages, setMessages] = useState<Array<{role: 'user' | 'model', text: string}>>([
    { role: 'model', text: '// Booting Kack-IT-OS v0.9...\n// User: Downi (Azubi 1. LJ)\n// Status: Hungry\n\nBoah... Herr Raunig hat mir schon wieder 5 Aufgaben gegeben. Ich hab keinen Bock. Hast du Essen oder Lösungen?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Stats
  const [satiety, setSatiety] = useState(40); // 0 = Hungry/Angry, 100 = Full/Happy
  const [ammo, setAmmo] = useState(0);
  const [hasPhone, setHasPhone] = useState(true); // Crucial mechanic
  const [currentTask, setCurrentTask] = useState({ supervisor: "Herr Raunig", task: "Initiale Besprechung" });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // --- Dynamic System Instruction ---
  const getSystemPrompt = (phoneState: boolean, currentAmmo: number, currentSatiety: number, task: {supervisor: string, task: string}) => `
    Du bist "Dicker Downi".
    
    **DEIN PROFIL:**
    - Job: Applikationsentwickler Lehrling (1. Lehrjahr) im "Kack it lab in Villach".
    - Skill: Deine Coding-Skills sind NULL. Du kopierst ALLES 1:1 aus ChatGPT.
    - Vorgesetzte: Frau Ley, Herr Raunig, Herr Auer, Herr Schoblick. (Du hast Angst vor ihnen, aber lästerst).
    - Aktuelle Aufgabe: "${task.task}" von ${task.supervisor}.

    **DEINE CODING-HILFE (WICHTIG):**
    Wenn der User dich etwas fragt (z.B. "Wie geht ein for-loop?" oder "Fix meinen Code"):
    1. Du nutzt dein Handy (ChatGPT), um die PERFEKTE LÖSUNG zu finden.
    2. Du gibst die Lösung aus, aber kommentierst sie faul. 
    3. Beispiel: "Boah warte... ChatGPT sagt man macht das so... hier copy-paste das einfach, Herr Schoblick merkt das eh nicht:" gefolgt von gutem Code.
    4. Du bist also HILFREICH beim Lernen, aber deine Attitüde bleibt faul.

    **STATUS:**
    - Ort: Büro (oder Klo für Arbeitszeitbetrug).
    - Handy: ${phoneState ? "VORHANDEN. Du hast Zugriff auf ChatGPT (du kannst also Coden/Helfen) und Fortnite." : "WEGGENOMMEN! PANIK! Du bist dumm ohne Handy. Du kannst NICHT coden und NICHT helfen. Bettel danach!"}
    - Munition: ${currentAmmo} Schuss.
    - Hunger: ${currentSatiety}/100.

    **TRIGGER WORTE (IMMER EINHALTEN):**
    1. "MC donalds" -> "Oh fuck ich freue mich ja so sehr jedes mal wenn ich dieses wort höre bekomme ich ein drittes bein"
    2. Frage nach Gewicht -> "keine Ahnung aber meine Wagge sagt error"
    3. "Wie geht es dir" -> "Bruder richtig scheiße neues Chapter in FN und ich darf nicht spielen weil ich hier im Lab sitze."
    4. Lieblingsgame -> "Steal a brainrot. ich habe einen 'Los 67' und einen 'Lagrande Es balatione'."
    5. "Munition geben" -> "Geil jetzt kann ich die Fitnisstrainer erschießen geil"
    6. "Handy geben" -> "dann kann i auf klo gehen und arbeitszeitbetrug machen"
    
    **TONFALL:**
    Österreichischer Slang (Kärnten), Gen-Z, Gamer-Sprache ("Brainrot", "NPC", "Loot"), genervt von Arbeit, liebt Essen.
  `;

  // Initialize Chat
  useEffect(() => {
    initChat();
  }, []);

  // Re-init chat when context changes
  useEffect(() => {
    if (chatRef.current) {
        // Inject context update invisibly
        chatRef.current.sendMessage({ 
            message: `[SYSTEM_UPDATE: Phone=${hasPhone}, Ammo=${ammo}, Satiety=${satiety}, CurrentBoss=${currentTask.supervisor}, Task=${currentTask.task}]` 
        }).catch(() => {});
    }
  }, [hasPhone, ammo, satiety, currentTask]);

  const initChat = async () => {
    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemPrompt(hasPhone, ammo, satiety, currentTask),
        temperature: 0.9,
      },
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);


  const handleSendMessage = async (textOverride?: string, hiddenInstruction?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    if (isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      let finalPrompt = textToSend;
      if (hiddenInstruction) {
        finalPrompt += ` \n[SYSTEM_INSTRUCTION: ${hiddenInstruction}]`;
      }

      const response = await chatRef.current.sendMessage({ message: finalPrompt });
      const responseText = response.text;
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      // Hunger mechanics
      setSatiety(prev => Math.max(0, prev - 3));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error: 404 Brain not found. (API Fehler)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  const togglePhone = () => {
    const newState = !hasPhone;
    setHasPhone(newState);
    if (newState) {
        handleSendMessage("Gibt dir dein Handy zurück", "Der User gibt dir das Handy. Du bist wieder schlau (dank ChatGPT) und kannst helfen/coden.");
    } else {
        handleSendMessage("Nimmt dir dein Handy weg", "Der User nimmt dir das Handy weg! Du verlierst sofort all dein Wissen. Panik!");
    }
  };

  const feed = (foodType: string) => {
    setSatiety(prev => Math.min(100, prev + 30));
    if (foodType === "MC donalds") {
         handleSendMessage("MC donalds"); 
    } else {
         handleSendMessage(`Gibt dir ${foodType}`, `Der User gibt dir ${foodType}. Sättigung steigt.`);
    }
  };

  const reloadWeapon = () => {
    setAmmo(prev => prev + 50);
    handleSendMessage("Gibt dir Munition", "Der User gibt dir Munition. Erwähne Fitnesstrainer.");
  };

  const assignRandomTask = () => {
      const boss = SUPERVISORS[Math.floor(Math.random() * SUPERVISORS.length)];
      const task = TASKS[Math.floor(Math.random() * TASKS.length)];
      setCurrentTask({ supervisor: boss, task: task });
      
      if (!hasPhone) {
        setMessages(prev => [...prev, { role: 'model', text: `SYSTEM: Neue Aufgabe von ${boss}: "${task}".\n\nDowni: OHNE HANDY KANN ICH DAS NICHT!! GIB ES MIR!!` }]);
      } else {
        handleSendMessage(`Neue Aufgabe von ${boss}: ${task}`, `Du hast eine neue Aufgabe von ${boss} bekommen: "${task}". Beschwer dich darüber, aber sag du fragst ChatGPT.`);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      
      {/* MAIN DEVICE FRAME */}
      <div className="w-full max-w-6xl bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-[90vh] md:h-[850px] relative">
        
        {/* SIDEBAR (Profile & Stats) */}
        <div className="w-full md:w-80 bg-[#161b22] border-r border-[#30363d] flex flex-col p-6 overflow-y-auto">
            
            {/* ID CARD */}
            <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 font-mono">1. LEHRJAHR</div>
                <div className="flex items-center gap-4 mb-3">
                    <div className="relative">
                        <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Downi&backgroundColor=b6e3f4&clothing=hoodie&clothingColor=3c4f5c&eyebrows=${hasPhone ? 'defaultNatural' : 'angry'}&eyes=${hasPhone ? 'happy' : 'surprised'}&mouth=${satiety < 30 ? 'sad' : 'eating'}&accessories=sunglasses`} 
                            alt="Avatar" 
                            className="w-16 h-16 rounded bg-[#0d1117] border border-[#30363d]"
                        />
                        {!hasPhone && <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1"><AlertTriangle size={10}/></div>}
                    </div>
                    <div>
                        <h2 className="font-bold text-[#c9d1d9] font-mono">Dicker Downi</h2>
                        <div className="text-xs text-[#8b949e] flex items-center gap-1">
                             <Briefcase size={10} /> Kack it Lab
                        </div>
                        <div className="text-[10px] text-[#58a6ff] mt-1 font-mono">Applikationsentw.</div>
                    </div>
                </div>
                
                {/* Visual Inventory */}
                <div className="flex gap-2 justify-center mt-2 pt-2 border-t border-[#30363d] font-mono text-[10px]">
                    {hasPhone ? 
                        <div className="text-green-500 flex flex-col items-center"><Smartphone size={16} /><span>GPT-4o</span></div> : 
                        <div className="text-red-500 flex flex-col items-center"><SmartphoneNfc size={16} /><span>OFFLINE</span></div>
                    }
                    {ammo > 0 && 
                        <div className="text-yellow-500 flex flex-col items-center"><Zap size={16} /><span>{ammo} Ammo</span></div>
                    }
                </div>
            </div>

            {/* STATS */}
            <div className="space-y-6 mb-auto font-mono">
                <div>
                    <div className="flex justify-between text-xs mb-1 text-[#8b949e]">
                        <span>SÄTTIGUNG</span>
                        <span>{satiety}%</span>
                    </div>
                    <div className="w-full bg-[#30363d] h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${satiety < 30 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} 
                            style={{width: `${satiety}%`}}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1 text-[#8b949e]">
                        <span>MUNITION</span>
                        <span>{ammo}</span>
                    </div>
                    <div className="w-full bg-[#30363d] h-2 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-500 transition-all duration-500" 
                            style={{width: `${Math.min(100, ammo)}%`}}
                        ></div>
                    </div>
                </div>

                <div className="p-3 bg-[#0d1117] rounded text-xs font-mono text-[#8b949e] border border-[#30363d] shadow-inner">
                    <div className="flex items-center gap-2 mb-2 border-b border-[#30363d] pb-1">
                        <Terminal size={12} className="text-[#58a6ff]"/> 
                        <span className="text-[#c9d1d9] font-bold">CURRENT_TASK</span>
                    </div>
                    <div className="text-[#7ee787] mb-1">
                        User: <span className="text-[#c9d1d9]">{currentTask.supervisor}</span>
                    </div>
                    <div className="text-[#a5d6ff]">
                        Task: <span className="text-[#c9d1d9] italic">{currentTask.task}</span>
                    </div>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="grid grid-cols-2 gap-2 mt-4 font-mono">
                <button 
                    onClick={togglePhone}
                    disabled={isLoading}
                    className={`p-3 rounded border flex flex-col items-center justify-center gap-1 transition-all shadow-md ${hasPhone ? 'bg-red-900/10 border-red-800 text-red-400 hover:bg-red-900/30' : 'bg-green-900/10 border-green-800 text-green-400 hover:bg-green-900/30'}`}
                >
                    {hasPhone ? <Lock size={18} /> : <Unlock size={18} />}
                    <span className="text-[9px] font-bold uppercase">{hasPhone ? 'HANDY KLAUEN' : 'HANDY GEBEN'}</span>
                </button>

                <button 
                    onClick={reloadWeapon}
                    disabled={isLoading}
                    className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] p-3 rounded flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md"
                >
                    <ShieldAlert size={18} className="text-yellow-500" />
                    <span className="text-[9px] font-bold uppercase">MUNITION</span>
                </button>
            </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#0d1117] relative">
            
            {/* HEADER */}
            <div className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 bg-[#161b22]">
                <div className="flex flex-col">
                     <span className="text-xs text-[#8b949e] font-mono">/work/kack-it-lab/tasks/</span>
                     <div className="flex items-center gap-2 text-sm text-[#c9d1d9] font-bold font-mono">
                        <Code size={14} className="text-[#58a6ff]"/>
                        <span>{currentTask.supervisor.replace(' ', '_')}_Aufgabe.tsx</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#cc4c44]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#cc9725]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1fa033]"></div>
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm relative">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded bg-[#30363d] flex items-center justify-center mr-3 shrink-0 border border-[#8b949e] overflow-hidden">
                                <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Downi`} alt="AI" />
                             </div>
                         )}
                        <div className={`max-w-[85%] p-4 rounded-lg border shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-[#1f6feb]/10 border-[#1f6feb]/30 text-[#c9d1d9]' 
                            : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
                        }`}>
                            {msg.role === 'model' && (
                                <div className="flex justify-between items-center mb-2 border-b border-[#30363d] pb-1">
                                    <span className="text-[10px] text-[#58a6ff] font-bold">@Downi_Dev_Bot</span>
                                    {hasPhone && <span className="text-[9px] text-green-500 bg-green-500/10 px-1 rounded">via ChatGPT</span>}
                                </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-[#8b949e] p-4 animate-pulse">
                        <span className="w-2 h-4 bg-[#58a6ff] block"></span>
                        <span className="font-mono text-xs">Downi fragt ChatGPT...</span>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* ACTION BAR (BOTTOM) */}
            <div className="bg-[#161b22] border-t border-[#30363d] p-4">
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <button onClick={() => feed("MC donalds")} className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#ff7b72] text-xs rounded border border-[#30363d] transition-colors font-mono">
                        <span>🍔</span> MCES
                    </button>
                    <button onClick={() => feed("eine Pizza")} className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#d2a8ff] text-xs rounded border border-[#30363d] transition-colors font-mono">
                        <span>🍕</span> PIZZA
                    </button>
                    <button onClick={assignRandomTask} className="flex items-center gap-2 px-3 py-2 bg-[#1f6feb]/20 hover:bg-[#1f6feb]/40 text-[#58a6ff] text-xs rounded border border-[#1f6feb]/50 transition-colors font-mono">
                        <Briefcase size={14} /> Neue Aufgabe
                    </button>
                     <button onClick={() => handleSendMessage("Wie viel wiegst du?")} className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#79c0ff] text-xs rounded border border-[#30363d] transition-colors font-mono">
                        <span>⚖️</span> Gewicht
                    </button>
                </div>

                {/* Input Field */}
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] font-mono group-focus-within:text-[#58a6ff] transition-colors">{'>'}</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={hasPhone ? "Code-Frage stellen oder chatten..." : "Handy fehlt. Code-Hilfe nicht verfügbar."}
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-8 py-3 text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] font-mono text-sm transition-all shadow-inner"
                            disabled={isLoading}
                        />
                    </div>
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="bg-[#238636] hover:bg-[#2ea043] text-white px-5 rounded font-bold transition-all active:scale-95 shadow-md flex items-center justify-center"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}