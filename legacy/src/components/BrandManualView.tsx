import React, { useState } from 'react';
import {
  Palette,
  Copy,
  Check,
  Download,
  AlertOctagon,
  Maximize2,
  Shield,
  Layers,
  Sparkles,
  Type,
  GlassWater,
  Shirt,
  Store,
  CreditCard,
  ShoppingBag,
  Eye,
  Info
} from 'lucide-react';
import { RhuaLogo, LogoVariant } from './RhuaLogo';

export const BrandManualView: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<LogoVariant>('horizontal');
  const [logoPreviewBg, setLogoPreviewBg] = useState<'black' | 'sand' | 'white'>('black');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const institutionalColors = [
    {
      name: 'Bege / Sand Institucional',
      codeName: 'RHUA Sand',
      hex: '#EED9C6',
      rgb: 'R238 G217 B198',
      cmyk: 'C07 M17 Y23 K0',
      bgClass: 'bg-[#EED9C6]',
      textClass: 'text-black',
      borderClass: 'border-[#DFC7B0]',
      description: 'Cor principal para contrastes em fundos escuros, elementos nobres, embalagens e tipografia.',
    },
    {
      name: 'Preto Institucional',
      codeName: 'RHUA Black',
      hex: '#000000',
      rgb: 'R0 G0 B0',
      cmyk: 'C60 M40 Y40 K100',
      bgClass: 'bg-[#000000]',
      textClass: 'text-[#EED9C6]',
      borderClass: 'border-slate-800',
      description: 'Cor estrutural primária para fundos noturnos, uniformes, fachadas e elementos de alto contraste.',
    },
    {
      name: 'Grafite Noturno (Suporte)',
      codeName: 'RHUA Night Slate',
      hex: '#14161B',
      rgb: 'R20 G22 B27',
      cmyk: 'C70 M60 Y50 K80',
      bgClass: 'bg-[#14161B]',
      textClass: 'text-[#EED9C6]',
      borderClass: 'border-slate-700',
      description: 'Tom de apoio para cartões Bento Grid, divisores e profundidade na interface digital.',
    },
    {
      name: 'Areia Dourada (Acento)',
      codeName: 'RHUA Gold Accent',
      hex: '#D8C2AC',
      rgb: 'R216 G194 B172',
      cmyk: 'C15 M22 Y32 K0',
      bgClass: 'bg-[#D8C2AC]',
      textClass: 'text-black',
      borderClass: 'border-[#C2A78E]',
      description: 'Acentos para bordas nobres, badges de status especiais e destaques financeiros.',
    },
  ];

  const improperUses = [
    { title: 'Não desalinhar elementos', desc: 'Manter sempre o alinhamento central e hierarquia das letras.', icon: 'R / H U A' },
    { title: 'Não distorcer', desc: 'Nunca esticar ou achatar horizontal ou verticalmente.', icon: 'R H U A (esticado)' },
    { title: 'Não utilize em outline', desc: 'Evitar traçado fino vazado sem preenchimento consistente.', icon: 'Outline puro' },
    { title: 'Não aplicar sem contraste', desc: 'Garantir sempre legibilidade (ex: bege no escuro ou preto no claro).', icon: 'Baixo contraste' },
    { title: 'Não altere os elementos', desc: 'Não substituir letras, símbolos ou feições do totem.', icon: 'Ícones trocados' },
    { title: 'Não altere a tipografia', desc: 'Não usar fontes genéricas como Arial ou Comic Sans.', icon: 'Fonte errada' },
    { title: 'Não aplicar moldura', desc: 'Não enquadrar a marca em caixas retangulares fechadas.', icon: 'Moldura pesada' },
    { title: 'Não altere as proporções', desc: 'Respeitar a relação entre a palavra RHUA e o subtítulo BAR.', icon: 'Proporção errada' },
  ];

  const applications = [
    {
      title: 'Fachada & Neon Urbano',
      category: 'Arquitetura & Ambiente',
      icon: Store,
      desc: 'Letreiro luminoso em relevo preto fosco com iluminação interna âmbar/areia (#EED9C6) e arte mural street art.',
      tag: 'Noturno & Sofisticado',
    },
    {
      title: 'Avental & Uniforme da Equipe',
      category: 'Vestuário Operacional',
      icon: Shirt,
      desc: 'Tecido de brim preto com o totem dos sentidos estilizado em estampa d’água grafite e logo RHUA BAR em bordado bege.',
      tag: 'Equipe de Bar',
    },
    {
      title: 'Coquetelaria Autoral & Taças',
      category: 'Experiência & Consumo',
      icon: GlassWater,
      desc: 'Taças balloon de Gin e copos de whisky com gravação fosca do Totem dos Sentidos e logotipo.',
      tag: 'Drinks & Cocktails',
    },
    {
      title: 'Cartões de Visita Frente & Verso',
      category: 'Papelaria Institucional',
      icon: CreditCard,
      desc: 'Versão em papel Soft Touch preto com Hot Stamping bege (#EED9C6) e versão em papel areia com Totem em relevo seco.',
      tag: 'Premium Touch',
    },
    {
      title: 'Ecobag & Tote Bag Promocional',
      category: 'Merchandising',
      icon: ShoppingBag,
      desc: 'Sacola em algodão cru ecológico com o símbolo dos sentidos estilizado estampado em preto serigráfico.',
      tag: 'Coleção Exclusiva',
    },
  ];

  const downloadLogoSvg = () => {
    const svgData = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="100%" height="100%" fill="#000000"/>
  <text x="200" y="110" font-family="'Playfair Display', Georgia, serif" font-size="52" font-weight="900" fill="#EED9C6" text-anchor="middle" letter-spacing="8">RHUA</text>
  <text x="200" y="145" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#DFC7B0" text-anchor="middle" letter-spacing="12">B A R</text>
</svg>`;
    const blob = new Blob([svgData.trim()], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RHUA_BAR_Logo_${selectedVariant}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bento Box */}
      <div className="bg-gradient-to-r from-[#000000] via-[#14161b] to-[#000000] border border-[#EED9C6]/20 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Totem watermark background */}
        <div className="absolute right-[-40px] top-[-30px] w-72 h-72 opacity-15 pointer-events-none">
          <RhuaLogo variant="symbol" colorMode="sand" size="custom" width="100%" height="100%" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EED9C6]/15 border border-[#EED9C6]/30 text-[#EED9C6] text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guia de Identidade Visual Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-wide text-[#EED9C6]">
              Manual de Marca RHUA BAR
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Diretrizes completas para aplicação do logotipo, paleta de cores institucional, tipografia, regras de resguardo e aplicações no sistema financeiro <strong>ADM RHUA</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadLogoSvg}
              className="px-4 py-2.5 rounded-xl bg-[#EED9C6] hover:bg-[#f3e5d8] text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-lg shadow-[#EED9C6]/20 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Logotipo Vetorial (.SVG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 1. Logotipo & Variantes Interativas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Logo Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
                  <Layers className="w-5 h-5 text-[#EED9C6]" />
                  <span>1. Logotipo & Variantes de Utilização</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alternâncias de formato para garantir legibilidade e impacto visual
                </p>
              </div>

              {/* Background switch */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Fundo:</span>
                <button
                  onClick={() => setLogoPreviewBg('black')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    logoPreviewBg === 'black'
                      ? 'bg-black text-[#EED9C6] shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Preto #000
                </button>
                <button
                  onClick={() => setLogoPreviewBg('sand')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    logoPreviewBg === 'sand'
                      ? 'bg-[#EED9C6] text-black shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Bege #EED9C6
                </button>
                <button
                  onClick={() => setLogoPreviewBg('white')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    logoPreviewBg === 'white'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Branco
                </button>
              </div>
            </div>

            {/* Display Canvas Box */}
            <div
              className={`w-full min-h-[260px] rounded-2xl flex items-center justify-center p-8 transition-colors duration-300 relative border ${
                logoPreviewBg === 'black'
                  ? 'bg-[#000000] border-slate-900 text-[#EED9C6]'
                  : logoPreviewBg === 'sand'
                  ? 'bg-[#EED9C6] border-[#dfc6af] text-black'
                  : 'bg-[#fafafa] border-slate-200 text-black'
              }`}
            >
              <RhuaLogo
                variant={selectedVariant}
                colorMode={logoPreviewBg === 'black' ? 'sand' : 'black'}
                size="xl"
              />
            </div>
          </div>

          {/* Variant Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {[
              { id: 'horizontal', label: 'Horizontal (Principal)', desc: 'Páginas 3, 5' },
              { id: 'block', label: 'Bloco 2x2 (Quadrada)', desc: 'Fachadas e Avental' },
              { id: 'vertical', label: 'Vertical (Coluna)', desc: 'Totens e Paredes' },
              { id: 'symbol', label: 'Símbolo dos Sentidos', desc: 'Copos e Ícone' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id as LogoVariant)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedVariant === v.id
                    ? 'bg-black text-[#EED9C6] border-black shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <p className="text-xs font-bold">{v.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{v.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Concept & Totem of Senses (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#EED9C6] shadow-md">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-serif">
              O Totem dos Sentidos
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O símbolo de <strong>RHUA BAR</strong> sintetiza a experiência sensorial completa do bar e da coquetelaria:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-[#EED9C6] shrink-0" />
                <span className="text-slate-700"><strong>Olho</strong> — A visão, a estética e a atmosfera noturna</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-[#EED9C6] shrink-0" />
                <span className="text-slate-700"><strong>Nariz</strong> — O olfato dos aromas e botânicos de drinks</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-[#EED9C6] shrink-0" />
                <span className="text-slate-700"><strong>Boca</strong> — O paladar e a degustação gastronômica</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-[#EED9C6] shrink-0" />
                <span className="text-slate-700"><strong>Orelha</strong> — A audição, a música e a vibração urbana</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-black rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#EED9C6]/80 mb-2">
              Símbolo Oficial do Bar
            </p>
            <div className="flex justify-center py-2">
              <RhuaLogo variant="symbol" colorMode="sand" size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cores Institucionais */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
              <Palette className="w-5 h-5 text-[#EED9C6]" />
              <span>2. Cores Institucionais (Paleta Oficial do Manual)</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Página 10 do Guia</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cores primárias e complementares para uso em interfaces, materiais gráficos e embalagens
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {institutionalColors.map((col, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border ${col.borderClass} overflow-hidden shadow-sm flex flex-col justify-between`}
            >
              {/* Color swatch box */}
              <div className={`${col.bgClass} ${col.textClass} p-5 flex flex-col justify-between min-h-[140px] relative`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black uppercase tracking-wider font-mono">
                    {col.codeName}
                  </span>
                  <button
                    onClick={() => handleCopy(col.hex, col.codeName)}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-xs text-current transition-colors cursor-pointer"
                    title="Copiar código HEX"
                  >
                    {copiedColor === col.codeName ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div>
                  <p className="text-xl font-black font-mono tracking-tight">{col.hex}</p>
                  <p className="text-[11px] opacity-80 font-mono mt-0.5">{col.rgb}</p>
                  <p className="text-[10px] opacity-70 font-mono">{col.cmyk}</p>
                </div>
              </div>

              {/* Color Description */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{col.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{col.description}</p>
                </div>

                <div className="pt-2 flex gap-1.5">
                  <button
                    onClick={() => handleCopy(col.hex, `${col.codeName}-hex`)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-bold text-slate-700 text-center transition-colors cursor-pointer"
                  >
                    Copiar HEX
                  </button>
                  <button
                    onClick={() => handleCopy(col.rgb, `${col.codeName}-rgb`)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-bold text-slate-700 text-center transition-colors cursor-pointer"
                  >
                    Copiar RGB
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tipografia & Área de Segurança */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipografia (Página 11) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
              <Type className="w-5 h-5 text-[#EED9C6]" />
              <span>3. Tipografia Institucional</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Página 11</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              A tipografia institucional oficial é da família <strong>Myriad Pro</strong> com suporte completo a pesos leves, médios e pesados. No sistema digital, pareia-se com fontes Display serifadas para o logotipo e sans-serif geométricas para números e relatórios.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-800 font-sans">Aa Bb Cc 123</span>
                <span className="text-xs font-mono font-bold text-slate-400">Myriad Pro / Sans</span>
              </div>
              <p className="text-xs text-slate-500 font-mono tracking-widest">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz 0123456789
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-normal text-slate-700">Regular</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Textos e descrições</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Semibold / Bold</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Títulos e botões</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-black text-slate-900 font-serif">Black Display</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Logotipo RHUA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Segurança & Dimensões Mínimas (Páginas 7 e 8) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
              <Shield className="w-5 h-5 text-[#EED9C6]" />
              <span>4. Área de Segurança & Dimensões</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Páginas 7 e 8</span>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-black rounded-2xl border border-slate-800 text-center relative overflow-hidden">
              <div className="border border-dashed border-[#EED9C6]/40 p-4 rounded-xl inline-block relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#EED9C6] bg-black px-1.5">
                  Área de Resguardo = Altura da letra "R"
                </span>
                <RhuaLogo variant="horizontal" colorMode="sand" size="md" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="font-bold text-slate-800">Dimensão Mínima Impressa</h4>
                <p className="text-slate-500 mt-0.5">40 mm de largura para assegurar legibilidade em impressos físicos.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="font-bold text-slate-800">Dimensão Mínima Digital</h4>
                <p className="text-slate-500 mt-0.5">80 px de largura em telas e dispositivos móveis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Usos Indevidos (Página 9) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              <span>5. Usos Indevidos da Marca (Proibições Estritas)</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Página 9 do Guia</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Para preservar a força e a integridade da marca RHUA BAR, evite as práticas abaixo:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {improperUses.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100/80 space-y-2 hover:bg-rose-50/70 transition-colors"
            >
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Galeria de Aplicações Reais de RHUA BAR (Páginas 12 a 20) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-serif">
              <Store className="w-5 h-5 text-[#EED9C6]" />
              <span>6. Aplicações no Mundo Real & Vivência do Bar</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Páginas 12 a 20 do Manual</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exemplos oficiais de aplicação da identidade em mobiliário, copos de coquetéis, uniformes e fachadas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app, idx) => {
            const Icon = app.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-black text-[#EED9C6] flex items-center justify-center shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EED9C6]/20 text-[#8E765F] border border-[#EED9C6]/40">
                      {app.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-black font-serif">
                    {app.title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {app.category}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {app.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Padrão do Manual</span>
                  <span className="text-slate-800 font-bold">100% Homologado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
