# Lamna Dev Analyzer

**Lamna Dev Analyzer** é uma extensão projetada para navegadores Chromium (Chrome, Edge, Brave) que permite a análise estrutural da DOM em tempo real e de forma não intrusiva. A extensão destaca os elementos da tela baseados nas coordenadas do mouse instantaneamente, exibindo caixas de texto flutuantes super responsivas e temas estéticos impressionantes.

## 🚀 Funcionalidades

- **Rastreamento em Tempo Real:** Segue o fluxo do mouse identificando `<Tags>`, `.classes`, e as dimensões (Width x Height).
- **Réguas Canvas Autogeridas:** Contém marcações dinâmicas a cada 10/50/100 pixels renderizadas perfeitamente de acordo com o redimensionamento da tela.
- **Sistema de Temas Completo:** Se ajusta a sua preferência.
  - **Neon Tech:** O padrão. Caixas semi-transparentes de estética Glassmorphism, com bordas limpas e focadas.
  - **LCD Âmbar:** Para uso old-school. Bordas apagadas, pixels na tela simulando uma placa Matrix LCD verdadeira (Theme Ambar).
  - **The Matrix:** Um tema "hacker" verde-escuro diretamente extraído de displays de terminais.
  - **Dinâmico (Auto):** A extensão detecta inteligentemente a cor dominante ou theme-color do site em que você está navegando e calcula o contraste das fontes automaticamente, gerando um esquema de cores próprio!
- **Modo Detetive (Hold `Ctrl`):** Revela a hierarquia completa e atributos ocultos de estilização de maneira instantânea, como:
  - Espaçamentos (Paddings, Margins e Box-Sizing)
  - Posicionamentos (Top, Left, Right, Bottom e Z-Index)
  - Cores Reais e Visuais (Text Color, Background Color, Opacidade e renderizacao RGB literal com paleta vizualizada)
  - Tipografia (Família de fontes e tamanhos computados).
- **Congelamento de Inspeção (Hold `Ctrl` + `Click`):** Precisa copiar a classe de um elemento inspecionado? Ao clicar no elemento segurando o Control, a caixa ficará travada na tela (Freeze mode), te permitindo usar o mouse para selecionar os textos dentro da *Info box*. Clique novamente para descongelar.

## ⌨️ Atalhos Essenciais

| Atalho | Ação | Descrição |
| --- | --- | --- |
| `Ctrl + Shift + L` | **Ligar/Desligar Visor** | Oculta rapidamente todas as linhas, regras e caixas da extensão sem precisar desinstalar ou desativar na loja, voltando a interagir com a página de modo 100% normal. |
| `Segurar Ctrl` | **Informações Avançadas** | Amplia o Info Box com dados estendidos (Parent Nodes, Hierarquia e Computed Styles) úteis para designers e CSS. |
| `Segurar Ctrl + Clicar (LCE)` | **Congelar Tela** | Congela o estado atual do tooltip. Isso permite mover o mouse livremente e **selecionar textos** que aparecem no tooltip do componente. Clique de novo com `Ctrl` em qualquer lugar para descongelar. |

## 📦 Como instalar

Como a extensão ainda está em desenvolvimento:
1. Acesse o painel de extensões do seu navegador (`chrome://extensions/` no Chrome ou `edge://extensions/` no Edge).
2. Marque a caixa de seleção e ative o **"Modo de Desenvolvedor"**.
3. Clique em **"Carregar sem compactação"** (Load Unpacked).
4. Selecione a pasta onde clonou este projeto. Pronto! A extensão estará disponível em todos os sites que visitar.

---

## 🔮 Roadmap / Ideias Futuras
Queremos tornar o Lamna Dev Analyzer ainda mais indispensável no dia a dia. Aqui estão algumas ideias sendo avaliadas para implementação:
1. **Analisa de Contraste Automático:** Inspecionar o nível de acessibilidade (WCAG) entre as cores da fonte e do fundo do elemento selecionado para identificar textos ilegíveis.
2. **Editor "Inline" Instantâneo:** Possibilidade de dar _dois cliques_ na área congelada da caixa de infos para alterar um padding ou cor e ver a mudança aplicada diretamente na renderização do site.
3. **Capture Mode (Imagens):** Botão/atalho no popup congelado para extrair/baixar perfeitamente apenas a div congelada para uma imagem PNG (como se fosse um recorte cirúrgico guiado pela engine de DOM).
4. **Wireframe Mode:** Um botão/atalho que desenha instantaneamente bordas transparentes em volta de absolutamente todas as divs dentro de um container selecionado exibindo a malha do site.
5. **Color-Picker embutido:** Uma "pipeta" (Eyedropper) ou tecla rápida pra copiar o código HEX de onde seu mouse passou, baseada no CSS lido (não num bitmap).

> Desenvolvido com muito café e precisão de layout. Em constante experimentação estética! 🧡
