---
read_when:
    - Nova instalação, onboarding travado ou erros na primeira execução
    - Escolhendo autenticação e assinaturas de provedor
    - Não consegue acessar docs.openclaw.ai, não consegue abrir o dashboard, instalação travada
sidebarTitle: First-run FAQ
summary: 'FAQ: início rápido e configuração da primeira execução — instalação, onboarding, autenticação, assinaturas, falhas iniciais'
title: 'FAQ: configuração da primeira execução'
x-i18n:
    generated_at: "2026-04-24T05:54:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Perguntas e respostas rápidas sobre início rápido e primeira execução. Para operações do dia a dia, modelos, autenticação, sessões
  e solução de problemas, consulte o [FAQ](/pt-BR/help/faq) principal.

  ## Início rápido e configuração da primeira execução

  <AccordionGroup>
  <Accordion title="Estou travado, qual é a forma mais rápida de destravar?">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que pedir
    ajuda no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de configuração ou ambiente** que
    ajudantes remotos não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir
    a configuração da sua máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o **checkout completo do código-fonte** por meio da instalação hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, para que o agente possa ler o código + a documentação e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar para a versão stable mais tarde
    executando novamente o instalador sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo) e depois executar apenas os
    comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

    Se você descobrir um bug real ou uma correção, por favor abra uma issue no GitHub ou envie um PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    O que eles fazem:

    - `openclaw status`: snapshot rápido da saúde do gateway/agente + configuração básica.
    - `openclaw models status`: verifica autenticação de provedor + disponibilidade de modelos.
    - `openclaw doctor`: valida e repara problemas comuns de configuração/estado.

    Outras verificações úteis na CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](#first-60-seconds-if-something-is-broken).
    Documentação de instalação: [Install](/pt-BR/install), [Installer flags](/pt-BR/install/installer), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O Heartbeat continua pulando. O que significam os motivos de pulo?">
    Motivos comuns para o Heartbeat pular:

    - `quiet-hours`: fora da janela configurada de horário ativo
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco ou apenas cabeçalhos
    - `no-tasks-due`: o modo de tarefa de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos de tarefa venceu ainda
    - `alerts-disabled`: toda a visibilidade de Heartbeat está desabilitada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados)

    No modo de tarefa, timestamps de vencimento só são avançados depois que uma execução real de Heartbeat
    é concluída. Execuções puladas não marcam tarefas como concluídas.

    Documentação: [Heartbeat](/pt-BR/gateway/heartbeat), [Automation & Tasks](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir do código-fonte e usar o onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode gerar assets da UI automaticamente. Após o onboarding, você normalmente executa o Gateway na porta **18789**.

    A partir do código-fonte (contribuidores/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se você ainda não tiver uma instalação global, execute por `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard após o onboarding?">
    O assistente abre o navegador com uma URL limpa do dashboard (sem token na URL) logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não tiver sido aberta, copie/cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard em localhost vs remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se pedir autenticação por segredo compartilhado, cole o token ou a senha configurados nas configurações da Control UI.
    - Fonte do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Fonte da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se ainda não houver segredo compartilhado configurado, gere um token com `openclaw doctor --generate-gateway-token`.

    **Fora do localhost:**

    - **Tailscale Serve** (recomendado): mantenha bind em loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, headers de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, assumindo host do gateway confiável); APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` em ingresso privado ou autenticação HTTP por trusted-proxy.
      Tentativas concorrentes ruins de autenticação Serve do mesmo cliente são serializadas antes de o limitador de falhas de autenticação registrá-las, então a segunda tentativa ruim já pode mostrar `retry later`.
    - **Bind na tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/` e depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um trusted proxy sem loopback, configure `gateway.auth.mode: "trusted-proxy"` e então abra a URL do proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado continua valendo pelo túnel; cole o token ou a senha configurados se solicitado.

    Consulte [Dashboard](/pt-BR/web/dashboard) e [Web surfaces](/pt-BR/web) para detalhes sobre modos de bind e autenticação.

  </Accordion>

  <Accordion title="Por que existem duas configurações de aprovação de execução para aprovações no chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha prompts de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz esse canal atuar como cliente nativo de aprovação para aprovações de execução

    A política de execução do host continua sendo o verdadeiro controle de aprovação. A configuração de chat controla apenas onde os
    prompts de aprovação aparecem e como as pessoas podem responder.

    Na maioria das configurações, você **não** precisa de ambas:

    - Se o chat já oferece suporte a comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo compatível puder inferir aprovadores com segurança, o OpenClaw agora habilita automaticamente aprovações nativas em DMs primeiro quando `channels.<channel>.execApprovals.enabled` está indefinido ou como `"auto"`.
    - Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal; o agente só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.
    - Use `approvals.exec` apenas quando os prompts também precisarem ser encaminhados para outros chats ou salas explícitas de operação.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` apenas quando quiser explicitamente que prompts de aprovação sejam publicados de volta na sala/tópico de origem.
    - Aprovações de Plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional de `approvals.plugin`, e apenas alguns canais nativos mantêm o tratamento nativo de aprovação de plugin por cima disso.

    Resumindo: encaminhamento é para roteamento, configuração de cliente nativo é para uma UX mais rica e específica do canal.
    Consulte [Exec Approvals](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De que runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Funciona em Raspberry Pi?">
    Sim. O Gateway é leve - a documentação lista **512MB-1GB de RAM**, **1 núcleo** e cerca de **500MB**
    de disco como suficientes para uso pessoal, e observa que um **Raspberry Pi 4 pode executá-lo**.

    Se você quiser mais folga (logs, mídia, outros serviços), **2GB é recomendado**, mas isso
    não é um mínimo rígido.

    Dica: um pequeno Pi/VPS pode hospedar o Gateway, e você pode parear **nodes** no seu laptop/celular para
    tela/câmera/canvas locais ou execução de comandos. Consulte [Nodes](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Alguma dica para instalações em Raspberry Pi?">
    Resumo: funciona, mas espere algumas arestas.

    - Use um SO **64-bit** e mantenha Node >= 22.
    - Prefira a instalação **hackable (git)** para que você possa ver logs e atualizar rapidamente.
    - Comece sem canais/Skills e depois adicione-os um por um.
    - Se você encontrar problemas estranhos com binários, normalmente é um problema de **compatibilidade com ARM**.

    Documentação: [Linux](/pt-BR/platforms/linux), [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Está travado em wake up my friend / o onboarding não conclui. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente na primeira conclusão. Se você vir essa linha **sem resposta**
    e os tokens permanecerem em 0, o agente nunca foi executado.

    1. Reinicie o Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Verifique status + autenticação:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se ainda travar, execute:

    ```bash
    openclaw doctor
    ```

    Se o Gateway for remoto, garanta que a conexão do túnel/Tailscale esteja ativa e que a UI
    esteja apontando para o Gateway correto. Consulte [Remote access](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente igual" (memória, histórico de sessão, autenticação e
    estado de canal), desde que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver em
    modo remoto, lembre-se de que o host do gateway é quem mantém o armazenamento de sessão e o workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, estará fazendo backup
    de **memória + arquivos de bootstrap**, mas **não** do histórico de sessão nem da autenticação. Eles ficam
    em `~/.openclaw/` (por exemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionados: [Migrating](/pt-BR/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Remote mode](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo o que há de novo na versão mais recente?">
    Consulte o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais novas ficam no topo. Se a seção superior estiver marcada como **Unreleased**, a próxima seção datada
    é a versão mais recente publicada. As entradas são agrupadas por **Highlights**, **Changes** e
    **Fixes** (além de seções de docs/outras quando necessário).

  </Accordion>

  <Accordion title="Não consigo acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` via Xfinity
    Advanced Security. Desabilite isso ou coloque `docs.openclaw.ai` na allowlist e tente novamente.
    Por favor, nos ajude a desbloqueá-lo reportando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se você ainda não conseguir acessar o site, a documentação está espelhada no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre stable e beta">
    **Stable** e **beta** são **dist-tags do npm**, não linhas de código separadas:

    - `latest` = stable
    - `beta` = build antecipada para testes

    Normalmente, uma versão stable chega primeiro em **beta**, depois uma etapa explícita
    de promoção move essa mesma versão para `latest`. Mantenedores também podem
    publicar direto em `latest` quando necessário. É por isso que beta e stable podem
    apontar para a **mesma versão** após a promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para one-liners de instalação e a diferença entre beta e dev, consulte o accordion abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a dist-tag `beta` do npm (pode corresponder a `latest` após promoção).
    **Dev** é a cabeça móvel de `main` (git); quando publicada, usa a dist-tag `dev` do npm.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador do Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mais detalhes: [Development channels](/pt-BR/install/development-channels) e [Installer flags](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como experimento os bits mais recentes?">
    Duas opções:

    1. **Canal dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Isso muda para a branch `main` e atualiza a partir do código-fonte.

    2. **Instalação hackable (a partir do site do instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso lhe dá um repositório local que você pode editar e depois atualizar via git.

    Se preferir um clone limpo manualmente, use:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentação: [Update](/pt-BR/cli/update), [Development channels](/pt-BR/install/development-channels),
    [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e o onboarding normalmente levam?">
    Estimativa aproximada:

    - **Instalação:** 2-5 minutos
    - **Onboarding:** 5-15 minutos, dependendo de quantos canais/modelos você configurar

    Se travar, use [Installer stuck](#quick-start-and-first-run-setup)
    e o loop rápido de depuração em [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute o instalador novamente com **saída detalhada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalação beta com saída detalhada:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para uma instalação hackable (git):

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

    Mais opções: [Installer flags](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows diz git not found ou openclaw not recognized">
    Dois problemas comuns no Windows:

    **1) erro npm spawn git / git not found**

    - Instale o **Git for Windows** e garanta que `git` esteja no seu PATH.
    - Feche e reabra o PowerShell, depois execute o instalador novamente.

    **2) openclaw is not recognized após a instalação**

    - Sua pasta global bin do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do usuário (não é necessário o sufixo `\bin` no Windows; na maioria dos sistemas é `%AppData%\npm`).
    - Feche e reabra o PowerShell após atualizar o PATH.

    Se você quiser a configuração mais tranquila no Windows, use **WSL2** em vez do Windows nativo.
    Documentação: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto chinês corrompido - o que devo fazer?">
    Isso normalmente é incompatibilidade de code page do console em shells nativos do Windows.

    Sintomas:

    - a saída de `system.run`/`exec` mostra chinês como mojibake
    - o mesmo comando aparece corretamente em outro perfil de terminal

    Solução rápida no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Depois reinicie o Gateway e tente novamente o comando:

    ```powershell
    openclaw gateway restart
    ```

    Se você ainda reproduzir isso na versão mais recente do OpenClaw, acompanhe/reporte em:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="A documentação não respondeu minha pergunta - como obtenho uma resposta melhor?">
    Use a instalação **hackable (git)** para ter o código-fonte completo e a documentação localmente, e então pergunte
    ao seu bot (ou Claude/Codex) _a partir dessa pasta_ para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Install](/pt-BR/install) e [Installer flags](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia do Linux e depois execute o onboarding.

    - Caminho rápido do Linux + instalação de serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Getting Started](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Install & updates](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para acessar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remote](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Mantemos um **hub de hospedagem** com os provedores comuns. Escolha um e siga o guia:

    - [VPS hosting](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como funciona na nuvem: o **Gateway é executado no servidor**, e você o acessa
    do seu laptop/celular pela Control UI (ou Tailscale/SSH). Seu estado + workspace
    vivem no servidor, então trate o host como fonte da verdade e faça backup dele.

    Você pode parear **nodes** (Mac/iOS/Android/headless) a esse Gateway na nuvem para acessar
    tela/câmera/canvas locais ou executar comandos no seu laptop enquanto mantém o
    Gateway na nuvem.

    Hub: [Platforms](/pt-BR/platforms). Acesso remoto: [Gateway remote](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [Nodes CLI](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar sozinho?">
    Resposta curta: **é possível, mas não recomendado**. O fluxo de atualização pode reiniciar o
    Gateway (o que derruba a sessão ativa), pode precisar de um checkout git limpo e
    pode pedir confirmação. É mais seguro executar atualizações a partir de um shell como operador.

    Use a CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se você realmente precisar automatizar a partir de um agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentação: [Update](/pt-BR/cli/update), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho recomendado de configuração. No **modo local**, ele orienta você por:

    - **Configuração de modelo/autenticação** (OAuth de provedor, chaves de API, setup-token da Anthropic, além de opções de modelo local como LM Studio)
    - Localização do **workspace** + arquivos de bootstrap
    - **Configurações do Gateway** (bind/porta/autenticação/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de plugins de canal empacotados como QQ Bot)
    - **Instalação de daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de saúde** e seleção de **Skills**

    Ele também avisa se o modelo configurado for desconhecido ou estiver sem autenticação.

  </Accordion>

  <Accordion title="Preciso de uma assinatura do Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outros) ou com
    **modelos apenas locais**, para que seus dados permaneçam no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são maneiras opcionais de autenticar esses provedores.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API Anthropic**: cobrança normal da API da Anthropic
    - **Claude CLI / autenticação por assinatura Claude no OpenClaw**: a equipe da Anthropic
      nos disse que esse uso voltou a ser permitido, e o OpenClaw está tratando o uso de `claude -p`
      como sancionado para essa integração, a menos que a Anthropic publique uma nova
      política

    Para hosts de gateway de longa duração, chaves de API da Anthropic ainda são a
    configuração mais previsível. OAuth do OpenAI Codex é explicitamente compatível para ferramentas externas como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas no estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentação: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [GLM Models](/pt-BR/providers/glm),
    [Local models](/pt-BR/gateway/local-models), [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar a assinatura Claude Max sem uma chave de API?">
    Sim.

    A equipe da Anthropic nos disse que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então
    o OpenClaw trata a autenticação por assinatura Claude e o uso de `claude -p` como sancionados
    para essa integração, a menos que a Anthropic publique uma nova política. Se você quiser
    a configuração mais previsível do lado do servidor, use uma chave de API da Anthropic.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim.

    A equipe da Anthropic nos disse que esse uso voltou a ser permitido, então o OpenClaw trata
    a reutilização do Claude CLI e o uso de `claude -p` como sancionados para esta integração,
    a menos que a Anthropic publique uma nova política.

    O setup-token da Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.
    Para cargas de trabalho de produção ou multiusuário, a autenticação por chave de API da Anthropic continua sendo a
    escolha mais segura e previsível. Se você quiser outras opções hospedadas em estilo assinatura
    no OpenClaw, consulte [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [GLM
    Models](/pt-BR/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
    Isso significa que sua **cota/limite de taxa da Anthropic** foi esgotado para a janela atual. Se você
    usa **Claude CLI**, espere a janela ser redefinida ou faça upgrade do seu plano. Se você
    usa uma **chave de API da Anthropic**, verifique o Anthropic Console
    para uso/cobrança e aumente os limites conforme necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, isso significa que o request está tentando usar
    o beta de contexto 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial é elegível para cobrança de contexto longo (cobrança por chave de API ou o
    caminho Claude-login do OpenClaw com Extra Usage habilitado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provedor estiver limitado por taxa.
    Consulte [Models](/pt-BR/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock é compatível?">
    Sim. O OpenClaw tem um provedor **Amazon Bedrock (Converse)** empacotado. Com marcadores de env da AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo Bedrock de streaming/texto e mesclá-lo como um provedor implícito `amazon-bedrock`; caso contrário, você pode habilitar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada manual de provedor. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Model providers](/pt-BR/providers/models). Se preferir um fluxo de chave gerenciada, um proxy compatível com OpenAI na frente do Bedrock continua sendo uma opção válida.
  </Accordion>

  <Accordion title="Como funciona a autenticação do Codex?">
    O OpenClaw oferece suporte a **OpenAI Code (Codex)** via OAuth (login do ChatGPT). Use
    `openai-codex/gpt-5.5` para OAuth do Codex pelo executor PI padrão. Use
    `openai/gpt-5.4` para o acesso atual direto por chave de API da OpenAI. O acesso direto
    por chave de API ao GPT-5.5 é compatível assim que a OpenAI o habilitar na API pública; hoje
    o GPT-5.5 usa assinatura/OAuth via `openai-codex/gpt-5.5` ou execuções nativas de servidor do app Codex com `openai/gpt-5.5` e `embeddedHarness.runtime: "codex"`.
    Consulte [Model providers](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o OpenClaw ainda menciona openai-codex?">
    `openai-codex` é o ID do provedor e do perfil de autenticação para OAuth de ChatGPT/Codex.
    Ele também é o prefixo explícito do modelo PI para OAuth do Codex:

    - `openai/gpt-5.4` = rota atual direta por chave de API da OpenAI no PI
    - `openai/gpt-5.5` = futura rota direta por chave de API assim que a OpenAI habilitar GPT-5.5 na API
    - `openai-codex/gpt-5.5` = rota OAuth do Codex no PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = rota nativa de servidor do app Codex
    - `openai-codex:...` = ID de perfil de autenticação, não uma referência de modelo

    Se você quiser o caminho direto de cobrança/limite da OpenAI Platform, defina
    `OPENAI_API_KEY`. Se quiser autenticação por assinatura ChatGPT/Codex, faça login com
    `openclaw models auth login --provider openai-codex` e use
    referências de modelo `openai-codex/*` para execuções PI.

  </Accordion>

  <Accordion title="Por que os limites do Codex OAuth podem diferir do ChatGPT web?">
    O Codex OAuth usa janelas de cota dependentes de plano gerenciadas pela OpenAI. Na prática,
    esses limites podem diferir da experiência no site/app do ChatGPT, mesmo quando
    ambos estão vinculados à mesma conta.

    O OpenClaw pode mostrar as janelas atualmente visíveis de uso/cota do provedor em
    `openclaw models status`, mas ele não inventa nem normaliza direitos do ChatGPT web
    em acesso direto à API. Se você quiser o caminho direto de cobrança/limite da OpenAI Platform,
    use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura da OpenAI (Codex OAuth)?">
    Sim. O OpenClaw oferece suporte completo a **OAuth por assinatura do OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth por assinatura em ferramentas/fluxos externos
    como o OpenClaw. O onboarding pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Model providers](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth do Gemini CLI?">
    O Gemini CLI usa um **fluxo de autenticação de Plugin**, não um client id ou secret em `openclaw.json`.

    Passos:

    1. Instale o Gemini CLI localmente para que `gemini` esteja no `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilite o Plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se os requests falharem, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway

    Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Model providers](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local serve para chats casuais?">
    Normalmente não. O OpenClaw precisa de contexto grande + segurança forte; modelos pequenos truncam e vazam. Se você realmente precisar, execute a maior build de modelo que conseguir localmente (LM Studio) e consulte [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de prompt injection - consulte [Security](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelo hospedado em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com eles usando `models.mode: "merge"` para que os fallbacks continuem disponíveis enquanto respeitam o provedor regional selecionado.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw roda em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional - algumas pessoas
    compram um como host sempre ativo, mas uma pequena VPS, home server ou máquina da classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) - o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar em Linux ou em outro lugar. Se você quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou pareie um node macOS.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes), [Mac remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para suporte ao iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages. Não precisa ser um Mac mini -
    qualquer Mac funciona. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage - o servidor BlueBubbles roda em macOS, enquanto o Gateway pode rodar em Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway em Linux/VPS e rode o servidor BlueBubbles em qualquer Mac conectado ao Messages.
    - Execute tudo no Mac se quiser a configuração de máquina única mais simples.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes),
    [Mac remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para rodar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro pode se conectar como um
    **node** (dispositivo complementar). Nodes não executam o Gateway - eles fornecem
    capacidades extras como tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ativo).
    - MacBook Pro executa o app macOS ou um host de node e pareia com o Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Documentação: [Nodes](/pt-BR/nodes), [Nodes CLI](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Vemos bugs de runtime, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se você ainda quiser experimentar com Bun, faça isso em um gateway não produtivo
    sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que entra em allowFrom?">
    `channels.telegram.allowFrom` é o **ID de usuário do Telegram do remetente humano** (numérico). Não é o nome de usuário do bot.

    A configuração pede apenas IDs numéricos de usuário. Se você já tiver entradas legadas `@username` na configuração, `openclaw doctor --fix` pode tentar resolvê-las.

    Mais seguro (sem bot de terceiros):

    - Envie DM ao seu bot, depois execute `openclaw logs --follow` e leia `from.id`.

    API oficial do Bot:

    - Envie DM ao seu bot, depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie DM a `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número de WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, via **roteamento multiagente**. Vincule a **DM** de WhatsApp (peer `kind: "direct"`, remetente E.164 como `+15551234567`) de cada remetente a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessão. As respostas continuam vindo da **mesma conta do WhatsApp**, e o controle de acesso por DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta do WhatsApp. Consulte [Multi-Agent Routing](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agente de "chat rápido" e um agente "Opus para código"?'>
    Sim. Use roteamento multiagente: dê a cada agente seu próprio modelo padrão e depois vincule rotas de entrada (conta do provedor ou peers específicos) a cada agente. A configuração de exemplo está em [Multi-Agent Routing](/pt-BR/concepts/multi-agent). Consulte também [Models](/pt-BR/concepts/models) e [Configuration](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funciona no Linux?">
    Sim. O Homebrew oferece suporte a Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, garanta que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo brew) para que ferramentas instaladas com `brew` sejam resolvidas em shells sem login.
    Builds recentes também prefixam diretórios bin comuns de usuário em serviços Linux systemd (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação hackable com git e npm install">
    - **Instalação hackable (git):** checkout completo do código-fonte, editável, melhor para contribuintes.
      Você executa builds localmente e pode corrigir código/documentação.
    - **npm install:** instalação global da CLI, sem repositório, melhor para "apenas executar".
      As atualizações vêm de dist-tags do npm.

    Documentação: [Getting started](/pt-BR/start/getting-started), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Instale a outra variante e depois execute o Doctor para que o serviço do gateway aponte para o novo entrypoint.
    Isso **não exclui seus dados** - apenas altera a instalação do código do OpenClaw. Seu estado
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

    O Doctor detecta incompatibilidade no entrypoint do serviço do gateway e oferece reescrever a configuração do serviço para corresponder à instalação atual (use `--repair` em automação).

    Dicas de backup: consulte [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em uma VPS?">
    Resposta curta: **se você quer confiabilidade 24/7, use uma VPS**. Se quiser o
    menor atrito possível e aceitar suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela de browser ao vivo.
    - **Contras:** suspensão/quedas de rede = desconexões, atualizações/reinicializações do SO interrompem, a máquina precisa ficar acordada.

    **VPS / nuvem**

    - **Prós:** sempre ativo, rede estável, sem problemas de suspensão do laptop, mais fácil de manter em execução.
    - **Contras:** normalmente roda headless (use capturas de tela), acesso remoto apenas a arquivos, você precisa usar SSH para atualizações.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam todos bem a partir de uma VPS. O único trade-off real é **browser headless** versus uma janela visível. Consulte [Browser](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões do gateway antes. Local é ótimo quando você está usando o Mac ativamente e quer acesso a arquivos locais ou automação de UI com um browser visível.

  </Accordion>

  <Accordion title="Quão importante é executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas **recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ativo, menos interrupções por suspensão/reinicialização, permissões mais limpas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** totalmente aceitável para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se você quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e pareie seu laptop como um **node** para ferramentas locais de tela/câmera/exec. Consulte [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, vários canais). Ferramentas de node e automação de browser podem consumir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação em Linux é mais testado nele.

    Documentação: [Linux](/pt-BR/platforms/linux), [VPS hosting](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa estar sempre ativa, acessível e ter
    RAM suficiente para o Gateway e quaisquer canais que você habilitar.

    Orientação básica:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar vários canais, automação de browser ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, **WSL2 é a configuração no estilo VM mais fácil** e tem a melhor
    compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [VPS hosting](/pt-BR/vps).
    Se você estiver executando macOS em uma VM, consulte [macOS VM](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — o FAQ principal (modelos, sessões, gateway, segurança, mais)
- [Install overview](/pt-BR/install)
- [Getting started](/pt-BR/start/getting-started)
- [Troubleshooting](/pt-BR/help/troubleshooting)
