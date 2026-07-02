---
description: Real-world OpenClaw projects from the community
read_when:
    - Buscando exemplos reais de uso do OpenClaw
    - Atualizando destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade e impulsionados pelo OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-07-02T08:03:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Projetos OpenClaw não são demos de brinquedo. Pessoas estão entregando fluxos de revisão de PR, apps móveis, automação residencial, sistemas de voz, devtools e workflows intensivos em memória a partir dos canais que já usam — builds nativos de chat no Telegram, WhatsApp, Discord e terminais; automação real para reservas, compras e suporte sem esperar por uma API; e integrações com o mundo físico usando impressoras, aspiradores, câmeras e sistemas domésticos.

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

## Novidades do Discord

Destaques recentes em programação, devtools, mobile e criação de produtos nativos de chat.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode finaliza a alteração, abre um PR, o OpenClaw revisa o diff e responde no Telegram com sugestões e um veredito claro de merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediu ao "Robby" (@openclaw) uma skill local para adega. Ele solicita uma exportação CSV de exemplo e um caminho de armazenamento, depois cria e testa a skill (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições, itens recorrentes, reserva de horário de entrega, confirmação do pedido. Sem APIs, apenas controle do navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atalho para uma região da tela, visão do Gemini, Markdown instantâneo na sua área de transferência.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop para gerenciar skills e comandos entre Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Encapsula o TTS da papla.media e envia os resultados como mensagens de voz no Telegram (sem autoplay irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Auxiliar instalado via Homebrew para listar, inspecionar e acompanhar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solucione problemas em impressoras BambuLab: status, trabalhos, câmera, AMS, calibração e mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para clicar de forma confiável em células de tabela.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faça upload para Cloudflare R2/S3 e gere links seguros de download pré-assinados. Útil para instâncias remotas do OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Criou um app iOS completo com mapas e gravação de voz, preparado para distribuição na App Store inteiramente via chat do Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA que integra dados do anel Oura com calendário, compromissos e agenda de academia.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Mais de 14 agentes sob um único Gateway com um orquestrador Opus 4.5 delegando para workers Codex. Veja o [artigo técnico](https://github.com/adam91holt/orchestrated-ai-articles) e o [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra a workflows agênticos (Claude Code, OpenClaw). Gerencie issues, projetos e workflows pelo terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leia, envie e arquive mensagens via Beeper Desktop. Usa a API MCP local do Beeper para que agentes possam gerenciar todos os seus chats (iMessage, WhatsApp e mais) em um só lugar.
</Card>

</CardGroup>

## Automação e workflows

Agendamento, controle de navegador, fluxos de suporte e o lado "faça a tarefa por mim" do produto.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descobriu e confirmou os controles do purificador; depois, o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele estiver bonito. Ele projetou uma skill e tirou a foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Um prompt agendado gera uma imagem de cena todas as manhãs (clima, tarefas, data, post favorito ou citação) por meio de uma persona do OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verificador de disponibilidade do Playtomic mais CLI de reserva. Nunca mais perca uma quadra aberta.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`

Coleta PDFs do e-mail e prepara documentos para um consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruiu um site pessoal inteiro via Telegram enquanto assistia à Netflix — do Notion para Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas, compara com palavras-chave do currículo e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

O OpenClaw conectou-se ao Jira e então gerou uma nova skill em tempo real (antes de ela existir no ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a skill diretamente no chat do Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Entra no TradingView via automação de navegador, captura gráficos e realiza análise técnica sob demanda. Nenhuma API necessária — apenas controle do navegador.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora um canal Slack da empresa, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um app implantado sem que ninguém pedisse.
</Card>

</CardGroup>

## Conhecimento e memória

Sistemas que indexam, pesquisam, lembram e raciocinam sobre conhecimento pessoal ou de equipe.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mecanismo de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`

Ingere exportações completas do WhatsApp, transcreve mais de 1 mil mensagens de voz, cruza com logs do git e gera relatórios Markdown vinculados.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Adiciona busca vetorial aos favoritos do Karakeep usando Qdrant mais embeddings da OpenAI ou Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`

Gerenciador de memória separado que transforma arquivos de sessão em memórias, depois em crenças e então em um modelo de si mesmo em evolução.
</Card>

</CardGroup>

## Voz e telefone

Pontos de entrada centrados em fala, pontes telefônicas e workflows intensivos em transcrição.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Ponte HTTP entre assistente de voz Vapi e OpenClaw. Chamadas telefônicas quase em tempo real com seu agente.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini e mais). Disponível no ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infraestrutura e implantação

Empacotamento, implantação e integrações que tornam o OpenClaw mais fácil de executar e estender.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway do OpenClaw em execução no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controle e automatize dispositivos do Home Assistant por meio de linguagem natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill do Home Assistant no ClawHub" />
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuração OpenClaw nixificada e completa para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendário usando khal e vdirsyncer. Integração de calendário auto-hospedada.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendário CalDAV no ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

O lado físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automação residencial nativa em Nix com OpenClaw como interface, além de painéis do Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Painel do Grafana do GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controle seu aspirador robô Roborock por meio de conversa natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

## Projetos da comunidade

Coisas que cresceram além de um único fluxo de trabalho e se tornaram produtos ou ecossistemas mais amplos.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`

Marketplace completo para equipamentos de astronomia. Criado com e ao redor do ecossistema OpenClaw.
</Card>

</CardGroup>

## Envie seu projeto

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Inclua detalhes">
    Conte-nos o que ele faz, inclua um link para o repositório ou demo e compartilhe uma captura de tela, se tiver uma.
  </Step>
  <Step title="Destaque">
    Adicionaremos projetos de destaque a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeiros passos](/pt-BR/start/getting-started)
- [OpenClaw](/pt-BR/start/openclaw)
