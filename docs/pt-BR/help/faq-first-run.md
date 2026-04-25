---
read_when:
    - Nova instalação, onboarding travado ou erros na primeira execução
    - Escolhendo autenticação e assinaturas de provider
    - Não é possível acessar docs.openclaw.ai, não é possível abrir o dashboard, instalação travada
sidebarTitle: First-run FAQ
summary: 'FAQ: configuração de início rápido e primeira execução — instalação, onboarding, autenticação, assinaturas, falhas iniciais'
title: 'FAQ: configuração da primeira execução'
x-i18n:
    generated_at: "2026-04-25T18:19:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  Perguntas e respostas sobre início rápido e primeira execução. Para operações do dia a dia, modelos, autenticação, sessões
  e solução de problemas, consulte o [FAQ](/pt-BR/help/faq) principal.

  ## Início rápido e configuração da primeira execução

  <AccordionGroup>
  <Accordion title="Estou travado. Qual é a forma mais rápida de destravar?">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que pedir ajuda
    no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de configuração ou ambiente** que
    pessoas ajudando remotamente não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas conseguem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir sua configuração
    em nível de máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o **checkout completo do código-fonte** por meio
    da instalação hackeável (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, para que o agente possa ler o código + docs e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar para a versão estável depois
    executando o instalador novamente sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo), e então executar apenas os
    comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

    Se você descobrir um bug real ou uma correção, abra uma issue no GitHub ou envie uma PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    O que eles fazem:

    - `openclaw status`: visão rápida da integridade do gateway/agent + configuração básica.
    - `openclaw models status`: verifica a autenticação do provider + disponibilidade de modelos.
    - `openclaw doctor`: valida e repara problemas comuns de configuração/estado.

    Outras verificações úteis da CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](#first-60-seconds-if-something-is-broken).
    Docs de instalação: [Install](/pt-BR/install), [Sinalizadores do instalador](/pt-BR/install/installer), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O Heartbeat continua pulando. O que significam os motivos de pulo?">
    Motivos comuns para pular o heartbeat:

    - `quiet-hours`: fora da janela configurada de active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco ou só com cabeçalhos
    - `no-tasks-due`: o modo de tarefa de `HEARTBEAT.md` está ativo, mas ainda não chegou a hora de nenhum dos intervalos de tarefa
    - `alerts-disabled`: toda a visibilidade do heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados)

    No modo de tarefa, os timestamps de vencimento só avançam depois que uma execução real de heartbeat
    é concluída. Execuções puladas não marcam tarefas como concluídas.

    Docs: [Heartbeat](/pt-BR/gateway/heartbeat), [Automação e tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir do código-fonte e usar o onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode compilar assets da UI automaticamente. Após o onboarding, normalmente você executa o Gateway na porta **18789**.

    A partir do código-fonte (colaboradores/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se você ainda não tiver uma instalação global, execute via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard após o onboarding?">
    O assistente abre seu navegador com uma URL limpa do dashboard (sem token) logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não tiver sido iniciada, copie e cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard em localhost versus remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se ele pedir autenticação por segredo compartilhado, cole o token ou a senha configurada nas configurações da Control UI.
    - Origem do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Origem da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se nenhum segredo compartilhado ainda estiver configurado, gere um token com `openclaw doctor --generate-gateway-token`.

    **Não está em localhost:**

    - **Tailscale Serve** (recomendado): mantenha o bind em loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, os cabeçalhos de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, assumindo host do gateway confiável); APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` em private-ingress ou autenticação HTTP de proxy confiável.
      Tentativas inválidas simultâneas de autenticação do Serve pelo mesmo cliente são serializadas antes que o limitador de autenticação com falha as registre, então a segunda nova tentativa inválida já pode mostrar `retry later`.
    - **Bind de tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/`, depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um proxy confiável que não seja loopback, configure `gateway.auth.mode: "trusted-proxy"`, e então abra a URL do proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado continua valendo pelo túnel; cole o token ou a senha configurada se isso for solicitado.

    Consulte [Dashboard](/pt-BR/web/dashboard) e [Superfícies web](/pt-BR/web) para detalhes de modos de bind e autenticação.

  </Accordion>

  <Accordion title="Por que existem duas configurações de aprovação de exec para aprovações no chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha solicitações de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz esse canal atuar como um cliente nativo de aprovação para aprovações de exec

    A política de exec do host continua sendo o gate real de aprovação. A configuração de chat só controla onde as solicitações de aprovação
    aparecem e como as pessoas podem responder.

    Na maioria das configurações, você **não** precisa de ambas:

    - Se o chat já oferece suporte a comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo com suporte puder inferir aprovadores com segurança, o OpenClaw agora ativa automaticamente aprovações nativas com prioridade para DM quando `channels.<channel>.execApprovals.enabled` estiver indefinido ou como `"auto"`.
    - Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal; o agent só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou se a aprovação manual for o único caminho.
    - Use `approvals.exec` apenas quando as solicitações também precisarem ser encaminhadas para outros chats ou salas operacionais explícitas.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` apenas quando você quiser explicitamente que as solicitações de aprovação sejam publicadas de volta na sala/tópico de origem.
    - Aprovações de Plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional por `approvals.plugin`, e apenas alguns canais nativos mantêm o tratamento nativo de aprovação de plugin por cima disso.

    Versão curta: encaminhamento é para roteamento, configuração de cliente nativo é para uma UX específica do canal mais rica.
    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De qual runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Funciona no Raspberry Pi?">
    Sim. O Gateway é leve — as docs listam **512MB-1GB de RAM**, **1 núcleo** e cerca de **500MB**
    de disco como suficientes para uso pessoal, e observam que um **Raspberry Pi 4 pode executá-lo**.

    Se você quiser folga extra (logs, mídia, outros serviços), **2GB são recomendados**, mas isso
    não é um mínimo rígido.

    Dica: um pequeno Pi/VPS pode hospedar o Gateway, e você pode emparelhar **nodes** no seu laptop/celular para
    tela/câmera/canvas locais ou execução de comandos. Consulte [Nodes](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Há dicas para instalações no Raspberry Pi?">
    Versão curta: funciona, mas espere algumas arestas.

    - Use um SO **64-bit** e mantenha Node >= 22.
    - Prefira a **instalação hackeável (git)** para poder ver logs e atualizar rapidamente.
    - Comece sem canais/Skills e depois adicione um por um.
    - Se você encontrar problemas binários estranhos, normalmente é um problema de **compatibilidade ARM**.

    Docs: [Linux](/pt-BR/platforms/linux), [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Está travado em wake up my friend / o onboarding não avança. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente na primeira inicialização completa. Se você vir essa linha sem **nenhuma resposta**
    e os tokens permanecerem em 0, o agent nunca foi executado.

    1. Reinicie o Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Verifique o status + autenticação:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se ainda travar, execute:

    ```bash
    openclaw doctor
    ```

    Se o Gateway for remoto, garanta que a conexão por túnel/Tailscale esteja ativa e que a UI
    esteja apontando para o Gateway correto. Consulte [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente igual" (memória, histórico de sessão, autenticação e
    estado do canal), desde que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço Gateway.

    Isso preserva configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver em
    modo remoto, lembre-se de que o host do gateway é o dono do armazenamento de sessões e do workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, estará fazendo backup
    de **memória + arquivos de bootstrap**, mas **não** do histórico de sessão nem da autenticação. Eles ficam
    em `~/.openclaw/` (por exemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migração](/pt-BR/install/migrating), [Onde as coisas ficam no disco](#where-things-live-on-disk),
    [Workspace do agent](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Modo remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo o que há de novo na versão mais recente?">
    Consulte o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais recentes ficam no topo. Se a seção do topo estiver marcada como **Unreleased**, a próxima seção
    datada é a versão mais recente publicada. As entradas são agrupadas em **Highlights**, **Changes** e
    **Fixes** (mais seções de docs/outras quando necessário).

  </Accordion>

  <Accordion title="Não é possível acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões da Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` por meio do Xfinity
    Advanced Security. Desative isso ou coloque `docs.openclaw.ai` na allowlist e tente novamente.
    Ajude-nos a desbloqueá-lo reportando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se você ainda não conseguir acessar o site, as docs estão espelhadas no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre stable e beta">
    **Stable** e **beta** são **dist-tags do npm**, não linhas de código separadas:

    - `latest` = stable
    - `beta` = build antecipado para testes

    Normalmente, uma release stable chega primeiro em **beta**, e depois uma etapa explícita
    de promoção move essa mesma versão para `latest`. Os mantenedores também podem
    publicar diretamente em `latest` quando necessário. Por isso beta e stable podem
    apontar para a **mesma versão** após a promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para one-liners de instalação e a diferença entre beta e dev, consulte o acordeão abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a dist-tag `beta` do npm (pode coincidir com `latest` após a promoção).
    **Dev** é a head móvel de `main` (git); quando publicada, usa a dist-tag `dev` do npm.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador do Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mais detalhes: [Canais de desenvolvimento](/pt-BR/install/development-channels) e [Sinalizadores do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como experimento os bits mais recentes?">
    Duas opções:

    1. **Canal dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Isso muda para a branch `main` e atualiza a partir do código-fonte.

    2. **Instalação hackeável (a partir do site do instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso fornece um repositório local que você pode editar e depois atualizar via git.

    Se preferir um clone limpo manualmente, use:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/pt-BR/cli/update), [Canais de desenvolvimento](/pt-BR/install/development-channels),
    [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e o onboarding normalmente levam?">
    Guia aproximado:

    - **Instalação:** 2-5 minutos
    - **Onboarding:** 5-15 minutos, dependendo de quantos canais/modelos você configurar

    Se travar, use [Instalador travado](#quick-start-and-first-run-setup)
    e o loop rápido de depuração em [Estou travado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute o instalador novamente com **saída detalhada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalação beta com detalhamento:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para uma instalação hackeável (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente no Windows (PowerShell):

    ```powershell
    # install.ps1 ainda não tem uma flag -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Mais opções: [Sinalizadores do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows diz git not found ou openclaw not recognized">
    Dois problemas comuns no Windows:

    **1) erro npm spawn git / git not found**

    - Instale **Git for Windows** e certifique-se de que `git` esteja no seu PATH.
    - Feche e reabra o PowerShell, depois execute o instalador novamente.

    **2) openclaw is not recognized após a instalação**

    - Sua pasta global bin do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do usuário (não é necessário o sufixo `\bin` no Windows; na maioria dos sistemas é `%AppData%\npm`).
    - Feche e reabra o PowerShell após atualizar o PATH.

    Se você quiser a configuração mais fluida no Windows, use **WSL2** em vez do Windows nativo.
    Docs: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto chinês corrompido - o que devo fazer?">
    Isso geralmente é uma incompatibilidade de code page do console em shells nativos do Windows.

    Sintomas:

    - A saída de `system.run`/`exec` renderiza chinês como texto corrompido
    - O mesmo comando parece normal em outro perfil de terminal

    Solução rápida no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Depois reinicie o Gateway e tente o comando novamente:

    ```powershell
    openclaw gateway restart
    ```

    Se você ainda reproduzir isso na versão mais recente do OpenClaw, acompanhe/reporte em:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="As docs não responderam minha pergunta - como obtenho uma resposta melhor?">
    Use a **instalação hackeável (git)** para ter localmente o código-fonte e as docs completos, depois pergunte
    ao seu bot (ou Claude/Codex) _a partir dessa pasta_ para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Install](/pt-BR/install) e [Sinalizadores do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia de Linux e depois execute o onboarding.

    - Caminho rápido do Linux + instalação de serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Primeiros passos](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Instalação e atualizações](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para acessar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Mantemos um **hub de hospedagem** com os provedores mais comuns. Escolha um e siga o guia:

    - [Hospedagem VPS](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como isso funciona na nuvem: o **Gateway é executado no servidor**, e você o acessa
    do seu laptop/celular por meio da Control UI (ou Tailscale/SSH). Seu estado + workspace
    ficam no servidor, então trate o host como a fonte de verdade e faça backup dele.

    Você pode emparelhar **nodes** (Mac/iOS/Android/headless) com esse Gateway em nuvem para acessar
    tela/câmera/canvas locais ou executar comandos no seu laptop enquanto mantém o
    Gateway na nuvem.

    Hub: [Plataformas](/pt-BR/platforms). Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar sozinho?">
    Resposta curta: **é possível, mas não recomendado**. O fluxo de atualização pode reiniciar o
    Gateway (o que encerra a sessão ativa), pode exigir um checkout git limpo e
    pode pedir confirmação. Mais seguro: execute atualizações em um shell como operador.

    Use a CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se você precisar automatizar a partir de um agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/pt-BR/cli/update), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho de configuração recomendado. No **modo local**, ele orienta você por:

    - **Configuração de modelo/autenticação** (OAuth do provider, chaves de API, setup-token do Anthropic, além de opções de modelo local como LM Studio)
    - Localização do **workspace** + arquivos de bootstrap
    - **Configurações do Gateway** (bind/porta/autenticação/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de plugins de canal empacotados como QQ Bot)
    - **Instalação de daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de integridade** e seleção de **Skills**

    Ele também avisa se o modelo configurado é desconhecido ou se está sem autenticação.

  </Accordion>

  <Accordion title="Preciso de uma assinatura do Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outros) ou com
    **modelos somente locais** para que seus dados permaneçam no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são formas opcionais de autenticar esses providers.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API Anthropic**: cobrança normal da API Anthropic
    - **Autenticação por Claude CLI / assinatura Claude no OpenClaw**: a equipe da Anthropic
      nos informou que esse uso é permitido novamente, e o OpenClaw está tratando o uso de `claude -p`
      como autorizado para essa integração, a menos que a Anthropic publique uma nova
      política

    Para hosts Gateway de longa duração, chaves de API Anthropic continuam sendo a configuração
    mais previsível. O OAuth do OpenAI Codex é explicitamente compatível com ferramentas externas
    como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas no estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [GLM Models](/pt-BR/providers/glm),
    [Modelos locais](/pt-BR/gateway/local-models), [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar a assinatura Claude Max sem chave de API?">
    Sim.

    A equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw é permitido novamente, então
    o OpenClaw trata a autenticação por assinatura do Claude e o uso de `claude -p` como autorizados
    para essa integração, a menos que a Anthropic publique uma nova política. Se você quiser
    a configuração mais previsível no lado do servidor, use uma chave de API Anthropic.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim.

    A equipe da Anthropic nos informou que esse uso é permitido novamente, então o OpenClaw trata
    a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração,
    a menos que a Anthropic publique uma nova política.

    O setup-token da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.
    Para cargas de trabalho de produção ou multiusuário, a autenticação com chave de API Anthropic continua sendo a
    escolha mais segura e previsível. Se você quiser outras opções hospedadas no estilo assinatura
    no OpenClaw, consulte [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [GLM
    Models](/pt-BR/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
    Isso significa que sua **cota/limite de taxa da Anthropic** se esgotou na janela atual. Se você
    usa **Claude CLI**, aguarde a janela ser redefinida ou faça upgrade do seu plano. Se você
    usa uma **chave de API Anthropic**, verifique o Anthropic Console
    para uso/cobrança e aumente os limites conforme necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, a solicitação está tentando usar
    o beta de contexto 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial é elegível para cobrança de contexto longo (cobrança por chave de API ou o
    caminho de login Claude do OpenClaw com Extra Usage ativado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provider estiver com rate limit.
    Consulte [Models](/pt-BR/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock é compatível?">
    Sim. O OpenClaw tem um provider empacotado **Amazon Bedrock (Converse)**. Com marcadores de ambiente da AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo Bedrock de streaming/texto e mesclá-lo como um provider implícito `amazon-bedrock`; caso contrário, você pode ativar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada manual de provider. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Providers de modelos](/pt-BR/providers/models). Se você preferir um fluxo de chave gerenciada, um proxy compatível com OpenAI na frente do Bedrock continua sendo uma opção válida.
  </Accordion>

  <Accordion title="Como funciona a autenticação do Codex?">
    O OpenClaw oferece suporte ao **OpenAI Code (Codex)** via OAuth (login do ChatGPT). Use
    `openai-codex/gpt-5.5` para OAuth do Codex por meio do runner PI padrão. Use
    `openai/gpt-5.5` para acesso direto com chave de API da OpenAI. O GPT-5.5 também pode usar
    assinatura/OAuth via `openai-codex/gpt-5.5` ou execuções nativas do app-server Codex
    com `openai/gpt-5.5` e `embeddedHarness.runtime: "codex"`.
    Consulte [Providers de modelos](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o OpenClaw ainda menciona openai-codex?">
    `openai-codex` é o id do provider e do perfil de autenticação para OAuth do ChatGPT/Codex.
    Ele também é o prefixo explícito de modelo PI para OAuth do Codex:

    - `openai/gpt-5.5` = rota atual direta com chave de API da OpenAI no PI
    - `openai-codex/gpt-5.5` = rota de OAuth do Codex no PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = rota nativa do app-server Codex
    - `openai-codex:...` = id do perfil de autenticação, não uma referência de modelo

    Se você quiser o caminho direto de cobrança/limite da OpenAI Platform, defina
    `OPENAI_API_KEY`. Se quiser autenticação por assinatura do ChatGPT/Codex, faça login com
    `openclaw models auth login --provider openai-codex` e use
    referências de modelo `openai-codex/*` para execuções PI.

  </Accordion>

  <Accordion title="Por que os limites de OAuth do Codex podem ser diferentes do ChatGPT web?">
    O OAuth do Codex usa janelas de cota dependentes do plano e gerenciadas pela OpenAI. Na prática,
    esses limites podem diferir da experiência no site/app do ChatGPT, mesmo quando
    ambos estão vinculados à mesma conta.

    O OpenClaw pode mostrar as janelas de uso/cota do provider atualmente visíveis em
    `openclaw models status`, mas ele não inventa nem normaliza permissões do ChatGPT web
    em acesso direto à API. Se você quiser o caminho direto de cobrança/limite da OpenAI Platform,
    use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura da OpenAI (OAuth do Codex)?">
    Sim. O OpenClaw oferece suporte completo ao **OAuth de assinatura do OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth por assinatura em ferramentas/workflows externos
    como o OpenClaw. O onboarding pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Providers de modelos](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth do Gemini CLI?">
    O Gemini CLI usa um **fluxo de autenticação de Plugin**, não um client id ou secret em `openclaw.json`.

    Etapas:

    1. Instale o Gemini CLI localmente para que `gemini` esteja no `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Ative o plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após o login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se as solicitações falharem, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway

    Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Providers de modelos](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local é adequado para chats casuais?">
    Normalmente não. O OpenClaw precisa de contexto grande + segurança forte; modelos pequenos truncam e deixam escapar coisas. Se precisar mesmo, execute localmente o build do **maior** modelo que você conseguir (LM Studio) e consulte [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de prompt injection — consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelo hospedado em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"` para que fallbacks continuem disponíveis enquanto respeitam o provider regionalizado que você selecionar.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw executa em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional — algumas pessoas
    compram um como host sempre ligado, mas uma pequena VPS, servidor doméstico ou máquina da classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) — o servidor BlueBubbles executa em qualquer Mac, e o Gateway pode executar no Linux ou em outro lugar. Se você quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou emparelhe um node macOS.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes), [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para suporte a iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages. **Não** precisa ser um Mac mini —
    qualquer Mac serve. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage — o servidor BlueBubbles executa no macOS, enquanto o Gateway pode executar no Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway em Linux/VPS e execute o servidor BlueBubbles em qualquer Mac conectado ao Messages.
    - Execute tudo no Mac se quiser a configuração mais simples em uma única máquina.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes),
    [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro pode se conectar como um
    **node** (dispositivo complementar). Nodes não executam o Gateway — eles fornecem capacidades
    extras como tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ligado).
    - O MacBook Pro executa o app macOS ou um host de node e emparelha com o Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Docs: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Vemos bugs de runtime, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se você ainda quiser experimentar com Bun, faça isso em um gateway que não seja de produção
    e sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que vai em allowFrom?">
    `channels.telegram.allowFrom` é **o ID de usuário do Telegram do remetente humano** (numérico). Não é o nome de usuário do bot.

    A configuração solicita apenas IDs de usuário numéricos. Se você já tiver entradas legadas `@username` na configuração, `openclaw doctor --fix` pode tentar resolvê-las.

    Mais seguro (sem bot de terceiros):

    - Envie uma DM para seu bot e depois execute `openclaw logs --follow` e leia `from.id`.

    API oficial de Bot:

    - Envie uma DM para seu bot e depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie uma DM para `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número de WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, via **roteamento multi-agent**. Vincule a **DM** de WhatsApp de cada remetente (peer `kind: "direct"`, remetente E.164 como `+15551234567`) a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessão. As respostas ainda vêm da **mesma conta do WhatsApp**, e o controle de acesso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta de WhatsApp. Consulte [Roteamento multi-agent](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agent de "chat rápido" e um agent "Opus para programação"?'>
    Sim. Use roteamento multi-agent: dê a cada agent seu próprio modelo padrão e depois vincule rotas de entrada (conta do provider ou peers específicos) a cada agent. A configuração de exemplo está em [Roteamento multi-agent](/pt-BR/concepts/multi-agent). Consulte também [Models](/pt-BR/concepts/models) e [Configuração](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim. O Homebrew oferece suporte ao Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, garanta que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo do brew) para que ferramentas instaladas via `brew` sejam resolvidas em shells sem login.
    Builds recentes também prefixam diretórios bin de usuário comuns em serviços Linux systemd (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação hackeável com git e npm install">
    - **Instalação hackeável (git):** checkout completo do código-fonte, editável, melhor para contribuidores.
      Você executa os builds localmente e pode corrigir código/docs.
    - **npm install:** instalação global da CLI, sem repositório, melhor para "apenas execute".
      As atualizações vêm das dist-tags do npm.

    Docs: [Primeiros passos](/pt-BR/start/getting-started), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Instale a outra variante e depois execute o Doctor para que o serviço do gateway aponte para o novo entrypoint.
    Isso **não apaga seus dados** — apenas altera a instalação de código do OpenClaw. Seu estado
    (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) permanecem intactos.

    De npm para git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    De git para npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    O Doctor detecta incompatibilidade de entrypoint no serviço do gateway e se oferece para reescrever a configuração do serviço para corresponder à instalação atual (use `--repair` em automações).

    Dicas de backup: consulte [Estratégia de backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em uma VPS?">
    Resposta curta: **se você quer confiabilidade 24/7, use uma VPS**. Se você quer o
    menor atrito e aceita suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela de navegador visível.
    - **Contras:** suspensão/queda de rede = desconexões, atualizações/reboots do SO interrompem, precisa ficar ligado.

    **VPS / nuvem**

    - **Prós:** sempre ligado, rede estável, sem problemas de suspensão do laptop, mais fácil de manter em execução.
    - **Contras:** geralmente executa sem interface gráfica (use screenshots), acesso apenas remoto a arquivos, você precisa usar SSH para atualizações.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem em uma VPS. A única troca real é **navegador headless** versus uma janela visível. Consulte [Browser](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões do gateway antes. Local é ótimo quando você está usando ativamente o Mac e quer acesso a arquivos locais ou automação de UI com um navegador visível.

  </Accordion>

  <Accordion title="Quão importante é executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas **recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ligado, menos interrupções por suspensão/reboot, permissões mais limpas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** totalmente adequado para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se você quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e emparelhe seu laptop como um **node** para ferramentas locais de tela/câmera/exec. Consulte [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, vários canais). Ferramentas Node e automação de navegador podem consumir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação no Linux é melhor testado nele.

    Docs: [Linux](/pt-BR/platforms/linux), [Hospedagem VPS](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa ficar sempre ligada, acessível e ter
    RAM suficiente para o Gateway e quaisquer canais que você ativar.

    Orientação de base:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar vários canais, automação de navegador ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, o **WSL2 é a configuração no estilo VM mais fácil** e tem a melhor
    compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [Hospedagem VPS](/pt-BR/vps).
    Se você estiver executando macOS em uma VM, consulte [VM macOS](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — o FAQ principal (modelos, sessões, gateway, segurança e mais)
- [Visão geral da instalação](/pt-BR/install)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Solução de problemas](/pt-BR/help/troubleshooting)
