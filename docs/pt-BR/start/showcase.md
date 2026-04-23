---
description: Real-world OpenClaw projects from the community
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizar destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade com tecnologia OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-04-23T14:08:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Vitrine

<div className="showcase-hero">
  <p className="showcase-kicker">Criado em chats, terminais, navegadores e salas de estar</p>
  <p className="showcase-lead">
    Projetos com OpenClaw não são demos de brinquedo. Pessoas estão entregando loops de revisão de PR, apps móveis, automação residencial,
    sistemas de voz, devtools e fluxos de trabalho pesados em memória a partir dos canais que já usam.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Assistir demos</a>
    <a href="#fresh-from-discord">Explorar projetos</a>
    <a href="https://discord.gg/clawd">Compartilhe o seu</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Criações nativas de chat</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, chat web e fluxos de trabalho com terminal em primeiro lugar.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Automação real</strong>
      <span>Reservas, compras, suporte, relatórios e controle de navegador sem esperar por uma API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Mundo local + físico</strong>
      <span>Impressoras, aspiradores, câmeras, dados de saúde, sistemas domésticos e bases pessoais de conhecimento.</span>
    </div>
  </div>
</div>

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Vídeos</a>
  <a href="#fresh-from-discord">Novidades do Discord</a>
  <a href="#automation-workflows">Automação</a>
  <a href="#knowledge-memory">Memória</a>
  <a href="#voice-phone">Voz &amp; Telefone</a>
  <a href="#infrastructure-deployment">Infraestrutura</a>
  <a href="#home-hardware">Casa &amp; Hardware</a>
  <a href="#community-projects">Comunidade</a>
  <a href="#submit-your-project">Enviar um projeto</a>
</div>

## Vídeos

<p className="showcase-section-intro">
  Comece aqui se quiser o caminho mais curto entre “o que é isso?” e “ok, entendi”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Passo a passo completo de configuração</h3>
    <p>VelvetShark, 28 minutos. Instale, faça o onboarding e chegue até um primeiro assistente funcional de ponta a ponta.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Assistir no YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Vídeo da comunidade</h3>
    <p>Uma passagem mais rápida por projetos, superfícies e fluxos de trabalho reais construídos em torno do OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Assistir no YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projetos no mundo real</h3>
    <p>Exemplos da comunidade, de loops de programação nativos de chat a hardware e automação pessoal.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Assistir no YouTube</a>
  </div>
</div>

## Novidades do Discord

<p className="showcase-section-intro">
  Destaques recentes em programação, devtools, mobile e criação de produtos nativos de chat.
</p>

<CardGroup cols={2}>

<Card title="Revisão de PR → feedback no Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

O OpenCode conclui a mudança → abre um PR → o OpenClaw revisa o diff e responde no Telegram com “minor suggestions” mais um veredito claro de merge (incluindo correções críticas a aplicar primeiro).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisão de PR do OpenClaw entregue no Telegram" />
</Card>

<Card title="Skill de adega em minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediu ao “Robby” (@openclaw) uma Skill local de adega. Ela solicita um CSV de exemplo exportado + onde armazená-lo e então cria/testa a Skill rapidamente (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw criando uma Skill local de adega a partir de CSV" />
</Card>

<Card title="Piloto automático de compras no Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições → itens habituais → reservar horário de entrega → confirmar pedido. Sem APIs, apenas controle de navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automação de compras no Tesco via chat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atalho para uma região da tela → visão do Gemini → Markdown instantâneo na área de transferência.

  <img src="/assets/showcase/snag.png" alt="Ferramenta SNAG de screenshot para Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop para gerenciar Skills/comandos em Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Notas de voz no Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Empacota o TTS do papla.media e envia os resultados como notas de voz no Telegram (sem autoplay irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Saída de nota de voz do Telegram a partir de TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper instalado via Homebrew para listar/inspecionar/observar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor no ClawHub" />
</Card>

<Card title="Controle de impressora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e diagnóstico de impressoras BambuLab: status, jobs, câmera, AMS, calibração e mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI no ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien no ClawHub" />
</Card>

<Card title="Refeições escolares no ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automação de reserva de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para clicar com confiabilidade nas células da tabela.
</Card>

<Card title="Upload para R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faz upload para Cloudflare R2/S3 e gera links seguros de download pré-assinados. Perfeito para instâncias remotas do OpenClaw.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Criou um app iOS completo com mapas e gravação de voz, implantado no TestFlight inteiramente via chat no Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS no TestFlight" />
</Card>

<Card title="Assistente de saúde com Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA integrando dados do Oura ring com calendário, compromissos e agenda da academia.

  <img src="/assets/showcase/oura-health.png" alt="Assistente de saúde com Oura ring" />
</Card>
<Card title="Kev's Dream Team (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Mais de 14 agentes sob um Gateway, com orquestrador Opus 4.5 delegando para workers do Codex. [Texto técnico](https://github.com/adam91holt/orchestrated-ai-articles) abrangente cobrindo a escalação Dream Team, seleção de modelos, sandboxing, Webhooks, Heartbeats e fluxos de delegação. [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes. [Post no blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI para o Linear que se integra a fluxos de trabalho agentic (Claude Code, OpenClaw). Gerencie issues, projetos e fluxos de trabalho pelo terminal. Primeiro PR externo aprovado!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Leia, envie e arquive mensagens via Beeper Desktop. Usa a API MCP local do Beeper para que agentes possam gerenciar todos os seus chats (iMessage, WhatsApp etc.) em um só lugar.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Automação & fluxos de trabalho

<p className="showcase-section-intro">
  Agendamento, controle de navegador, loops de suporte e o lado “apenas faça a tarefa para mim” do produto.
</p>

<CardGroup cols={2}>

<Card title="Controle do purificador de ar Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

O Claude Code descobriu e confirmou os controles do purificador, e então o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controle do purificador de ar Winix via OpenClaw" />
</Card>

<Card title="Fotos bonitas do céu pela câmera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele estiver bonito — ele projetou uma Skill e tirou a foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Foto do céu capturada por câmera no telhado com OpenClaw" />
</Card>

<Card title="Cena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Um prompt agendado gera uma única imagem de “cena” toda manhã (clima, tarefas, data, post/citação favorita) por meio de uma persona do OpenClaw.
</Card>

<Card title="Reserva de quadra de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Verificador de disponibilidade + CLI de reserva para o Playtomic. Nunca mais perca uma quadra livre.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="captura de tela do padel-cli" />
</Card>

<Card title="Recebimento contábil" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`
  
  Coleta PDFs do email e prepara documentos para o consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Modo dev no sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Reconstruiu o site pessoal inteiro via Telegram enquanto assistia Netflix — Notion → Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Agente de busca de emprego" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas de emprego, faz correspondência com palavras-chave do currículo e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Criador de Skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

O OpenClaw se conectou ao Jira e depois gerou uma nova Skill dinamicamente (antes de ela existir no ClawHub).
</Card>

<Card title="Skill do Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a Skill diretamente no chat do Telegram.
</Card>

<Card title="Análise no TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView via automação de navegador, captura screenshots de gráficos e realiza análise técnica sob demanda. Sem API — apenas controle de navegador.
</Card>

<Card title="Suporte automático no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora o canal da empresa no Slack, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um app implantado sem ser solicitado.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Conhecimento & memória

<p className="showcase-section-intro">
  Sistemas que indexam, pesquisam, lembram e raciocinam sobre conhecimento pessoal ou de equipe.
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motor de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="feedback de pronúncia do xuezh" />
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`
  
  Ingesta exportações completas do WhatsApp, transcreve mais de 1 mil notas de voz, faz verificação cruzada com logs do git e produz relatórios em Markdown com links.
</Card>

<Card title="Karakeep Semantic Search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Adiciona pesquisa vetorial aos favoritos do Karakeep usando embeddings de Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memória de Inside Out 2" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`
  
  Gerenciador de memória separado que transforma arquivos de sessão em memórias → crenças → modelo de si em evolução.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Voz & telefone

<p className="showcase-section-intro">
  Pontos de entrada com voz em primeiro lugar, pontes telefônicas e fluxos de trabalho intensivos em transcrição.
</p>

<CardGroup cols={2}>

<Card title="Ponte telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Ponte HTTP entre assistente de voz Vapi e OpenClaw. Chamadas telefônicas quase em tempo real com o seu agente.
</Card>

<Card title="Transcrição via OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini etc.). Disponível no ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Infraestrutura & implantação

<p className="showcase-section-intro">
  Empacotamento, implantação e integrações que tornam o OpenClaw mais fácil de executar e estender.
</p>

<CardGroup cols={2}>

<Card title="Add-on do Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway do OpenClaw executando no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controle e automatize dispositivos do Home Assistant por linguagem natural.
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuração OpenClaw em Nix com tudo incluído para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendário usando khal/vdirsyncer. Integração de calendário self-hosted.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Casa & hardware

<p className="showcase-section-intro">
  O lado físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.
</p>

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automação residencial nativa de Nix com OpenClaw como interface, além de lindos painéis no Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="painel Grafana do GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controle seu aspirador robô Roborock por conversa natural.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="status do Roborock" />
</Card>

</CardGroup>

## Projetos da comunidade

<p className="showcase-section-intro">
  Coisas que cresceram além de um único fluxo de trabalho e viraram produtos ou ecossistemas mais amplos.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo de equipamentos de astronomia. Construído com/em torno do ecossistema OpenClaw.
</Card>

</CardGroup>

---

## Envie seu projeto

<p className="showcase-section-intro">
  Se você está construindo algo interessante com OpenClaw, envie. Bons screenshots e resultados concretos ajudam.
</p>

Tem algo para compartilhar? Adoraríamos destacar!

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [tweet para @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Inclua detalhes">
    Conte o que faz, envie o link do repositório/demo e compartilhe um screenshot, se tiver
  </Step>
  <Step title="Seja destaque">
    Vamos adicionar os projetos mais marcantes a esta página
  </Step>
</Steps>
