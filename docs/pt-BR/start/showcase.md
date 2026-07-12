---
description: Real-world OpenClaw projects from the community
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizando os destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade e desenvolvidos com OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-07-12T00:25:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Projetos OpenClaw criados pela comunidade: ciclos de revisão de PRs, aplicativos móveis, automação residencial, sistemas de voz, ferramentas de desenvolvimento e fluxos de trabalho de memória, desenvolvidos nativamente para conversas no Telegram, WhatsApp, Discord e em terminais.

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto no [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

## Novidades do Discord

Destaques recentes em programação, ferramentas de desenvolvimento, dispositivos móveis e criação de produtos nativos para conversas.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Diga ao seu agente "implante este HTML" e receba uma URL pública em cerca de um segundo. As páginas expiram automaticamente após uma hora — sem servidor, sem configuração e sem cadastro.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Cole qualquer URL e receba um veredito. Mais de 2,5 milhões de domínios fraudulentos provenientes de 38 fontes (PhishTank, OpenPhish, CERT.PL e outras), verificados localmente para que o histórico de navegação nunca saia da máquina.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Um trio para trabalhos de produto: o [Diálogo Socrático](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) examina uma questão minuciosamente antes de responder, o [Estrategista do Modelo Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) classifica os recursos para identificar quais merecem seu lugar, e a [Saída Legível do Agente](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) reescreve a saída do agente em linguagem simples.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Impede que orquestradores fiquem ociosos enquanto subagentes trabalham: um mecanismo de retorno de chamada assíncrono no qual os resultados chegam a uma caixa de entrada, em vez de bloquear o agente principal.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Mantém o OpenClaw utilizável em máquinas com 2 a 4 GB: verifica a memória livre e reduz recursos pesados antes que a máquina comece a usar memória de troca. [Código-fonte no GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Rastreador de custos de tokens criado por um engenheiro da NVIDIA, com suporte de primeira classe ao OpenClaw: veja exatamente para onde vão os gastos do seu agente, por modelo e por sessão.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Descreva um diagrama na conversa e receba um esboço do Excalidraw gerado programaticamente.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Fez o OpenClaw criar sua própria ferramenta de consulta do Google Analytics e depois a empacotou e publicou no ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Compara modelos em 59 funções de agente para responder "qual LLM usar com minha GPU?". Um favorito da comunidade para escolher modelos locais.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Geração de músicas independente de provedor: planeje a faixa, estruture a letra e revise resultados incompletos, em vez de depender de uma única solicitação. Inclui uma [variante do MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) com controle de BPM, tonalidade, estrutura e mashup.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

O OpenCode conclui a alteração e abre um PR; o OpenClaw revisa as diferenças e responde no Telegram com sugestões e um veredito claro sobre a mesclagem.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediu ao "Robby" (@openclaw) uma Skill local para adega de vinhos. Ele solicita uma amostra da exportação CSV e um caminho de armazenamento e, em seguida, cria e testa a Skill (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições, itens habituais, agendamento da entrega e confirmação do pedido. Sem APIs, apenas controle do navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Use uma tecla de atalho para capturar uma região da tela, processe-a com a visão do Gemini e obtenha Markdown instantaneamente na área de transferência.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicativo para desktop que gerencia Skills e comandos no Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Integra a conversão de texto em fala da papla.media e envia os resultados como mensagens de voz no Telegram (sem reprodução automática irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Utilitário instalado pelo Homebrew para listar, inspecionar e monitorar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solucione problemas de impressoras BambuLab: status, trabalhos, câmera, AMS, calibração e muito mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status dos elevadores e planejamento de rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Agendamento automatizado de refeições escolares no Reino Unido por meio do ParentPay. Usa coordenadas do mouse para clicar com precisão nas células da tabela.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Envie arquivos para o Cloudflare R2/S3 e gere links de download pré-assinados e seguros. Útil para instâncias remotas do OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Criou um aplicativo completo para iOS com mapas e gravação de voz, preparado para distribuição na App Store inteiramente por meio de uma conversa no Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA que integra dados do anel Oura ao calendário, compromissos e cronograma da academia.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Mais de 14 agentes em um único Gateway, com um orquestrador Opus 4.5 delegando tarefas a agentes Codex. Consulte a [descrição técnica](https://github.com/adam91holt/orchestrated-ai-articles) e o [Clawdspace](https://github.com/adam91holt/clawdspace) para saber mais sobre o isolamento de agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para o Linear que se integra a fluxos de trabalho com agentes (Claude Code, OpenClaw). Gerencie problemas, projetos e fluxos de trabalho pelo terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leia, envie e arquive mensagens pelo Beeper Desktop. Usa a API MCP local do Beeper para que agentes possam gerenciar todas as suas conversas (iMessage, WhatsApp e outras) em um só lugar.
</Card>

</CardGroup>

## Automação e fluxos de trabalho

Agendamento, controle do navegador, ciclos de suporte e o lado do produto que simplesmente realiza a tarefa por você.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

O Claude Code descobriu e confirmou os controles do purificador; depois, o OpenClaw assume o gerenciamento da qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele estiver bonito. O OpenClaw projetou uma Skill e fez a captura.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Uma solicitação agendada gera todas as manhãs a imagem de uma cena (clima, tarefas, data, publicação ou citação favorita) por meio de uma persona do OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verificador de disponibilidade do Playtomic e CLI para reservas. Nunca mais perca uma quadra disponível.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`

Coleta PDFs do e-mail e prepara documentos para um consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Recriou um site pessoal inteiro pelo Telegram enquanto assistia à Netflix — do Notion para o Astro, com 18 publicações migradas e o DNS transferido para o Cloudflare. Não abriu um laptop sequer.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas de emprego, compara-as com palavras-chave do currículo e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw conectou-se ao Jira e, em seguida, gerou uma nova Skill dinamicamente (antes que ela existisse no ClawHub).
</Card>

<Card title="Skill do Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a Skill diretamente no chat do Telegram.
</Card>

<Card title="Análise do TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView por meio de automação do navegador, captura imagens dos gráficos e realiza análises técnicas sob demanda. Não requer API — apenas controle do navegador.
</Card>

<Card title="Negociação de carro (economia de US$ 4.200)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Deixou o OpenClaw negociar livremente com concessionárias: ele conduziu toda a negociação e reduziu o preço em US$ 4.200.
</Card>

<Card title="Piloto automático para check-in de voo" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Encontra o próximo voo no e-mail, realiza o check-in on-line e escolhe um assento na janela — sem precisar do aplicativo da companhia aérea.
</Card>

<Card title="Registro de sinistro de seguro" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Registrou um sinistro de seguro e agendou de forma autônoma a consulta de acompanhamento.
</Card>

<Card title="Skill imobiliária do Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI da API do Idealista para consultas e avaliações de imóveis, empacotada como uma Skill para que o agente possa procurar imóveis pelo chat.
</Card>

<Card title="Administração de empresa de jardinagem" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Monitora o Gmail em busca de ordens de serviço, analisa fotos de propriedades enviadas pelo Telegram, cria PDFs de orçamento de várias páginas em LaTeX e emite faturas pelo Xero.
</Card>

<Card title="Suporte automático no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora um canal corporativo do Slack, responde de forma útil e encaminha notificações ao Telegram. Corrigiu de forma autônoma um bug de produção em um aplicativo implantado sem que ninguém pedisse.
</Card>

</CardGroup>

## Conhecimento e memória

Sistemas que indexam, pesquisam, lembram e raciocinam sobre o conhecimento pessoal ou da equipe.

<CardGroup cols={2}>

<Card title="Aprendizado de chinês com xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mecanismo de aprendizado de chinês com feedback de pronúncia e fluxos de estudo por meio do OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback de pronúncia do xuezh" />
</Card>

<Card title="Pipeline de análise de publicações no X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Coletou 4 milhões de publicações de 100 das principais contas do X e as transformou em um pipeline de análise consultável.
</Card>

<Card title="Resultados laboratoriais no Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Organizou anos de resultados de exames de sangue em um banco de dados estruturado no Notion.
</Card>

<Card title="Segundo cérebro no Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Assistente de uso diário no WhatsApp, com toda a memória armazenada como Markdown em um cofre do Obsidian com controle de versão: monitoramento de calorias e exercícios, listas de tarefas e administração da vida cotidiana.
</Card>

<Card title="Bot de história da família" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Participa de um chat familiar em grupo no Telegram, documenta histórias de mais de 50 parentes e faz perguntas complementares bem fundamentadas — respondendo em nepalês para falantes nativos.
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`

Importa exportações completas do WhatsApp, transcreve mais de mil mensagens de voz, cruza as informações com logs do Git e gera relatórios interligados em Markdown.
</Card>

<Card title="Pesquisa semântica no Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Adiciona pesquisa vetorial aos favoritos do Karakeep usando Qdrant e embeddings da OpenAI ou do Ollama.
</Card>

<Card title="Memória de Inside-Out-2" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`

Gerenciador de memória separado que transforma arquivos de sessão em memórias, depois em crenças e, por fim, em um modelo de si mesmo em constante evolução.
</Card>

</CardGroup>

## Voz e telefone

Pontos de entrada centrados em voz, pontes telefônicas e fluxos de trabalho com uso intensivo de transcrição.

<CardGroup cols={2}>

<Card title="Voz com um toque no Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Um toque no Pebble Ring inicia uma conversa por voz com o OpenClaw — acesso ao agente por meio de um dispositivo vestível.
</Card>

<Card title="Estúdio de mídia para criadores" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Um estúdio de mídia completo no chat: TTS, transcrição e automação do navegador integrados ao Codex 5.2 e ao MiniMax.
</Card>

<Card title="Walkie-talkie com o Action Button" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Action Button do iPhone conectado ao OpenClaw: pressione, fale e o agente responde como um walkie-talkie.
</Card>

<Card title="Ponte telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Ponte entre o assistente de voz Vapi e o OpenClaw via HTTP. Chamadas telefônicas quase em tempo real com seu agente.
</Card>

<Card title="Transcrição com OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini e outros). Disponível no ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcrição do OpenRouter no ClawHub" />
</Card>

</CardGroup>

## Infraestrutura e implantação

Empacotamento, implantação e integrações que facilitam a execução e a extensão do OpenClaw.

<CardGroup cols={2}>

<Card title="Complemento para Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway do OpenClaw em execução no Home Assistant OS, com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill para Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controle e automatize dispositivos do Home Assistant por meio de linguagem natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill do Home Assistant no ClawHub" />
</Card>

<Card title="Gerenciador da barra de menus do macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Aplicativo nativo em Swift para a barra de menus, que mostra o status do agente e oferece controles rápidos.
</Card>

<Card title="Empacotamento com Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuração nixificada e completa do OpenClaw para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendário que usa khal e vdirsyncer. Integração com calendário auto-hospedado.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendário CalDAV no ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

O lado físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.

<CardGroup cols={2}>

<Card title="Skill para HomePod criada automaticamente" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

O OpenClaw encontrou os HomePods na rede local e criou para si mesmo uma Skill para controlá-los.
</Card>

<Card title="Interface de cubo holográfico de US$ 35" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Um cubo holográfico barato serve como o rosto físico do agente sobre a mesa.
</Card>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automação residencial nativa do Nix, com o OpenClaw como interface e painéis do Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Painel do Grafana no GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controle seu aspirador robô Roborock por meio de conversas naturais.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

## Projetos da comunidade

Projetos que cresceram além de um único fluxo de trabalho e se tornaram produtos ou ecossistemas mais amplos.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipamentos de astronomia. Criado com e em torno do ecossistema OpenClaw.
</Card>

<Card title="Protocolo de negociação entre agentes Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Negociação aberta entre agentes: seu agente negocia ofertas, agendas e contratos de serviço com outros Nodes e assina criptograficamente o resultado — você apenas aprova ou rejeita.
</Card>

</CardGroup>

## Envie seu projeto

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [mencione @openclaw no X](https://x.com/openclaw).
  </Step>
  <Step title="Inclua detalhes">
    Conte o que o projeto faz, inclua um link para o repositório ou a demonstração e compartilhe uma captura de tela, se tiver.
  </Step>
  <Step title="Ganhe destaque">
    Adicionaremos os projetos de destaque a esta página.
  </Step>
</Steps>

## Conteúdo relacionado

- [Primeiros passos](/pt-BR/start/getting-started)
- [OpenClaw](/pt-BR/start/openclaw)
- [Mostruário completo do X em openclaw.ai](https://openclaw.ai/showcase/)
