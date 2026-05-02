---
read_when:
    - Nova instalação, configuração inicial travada ou erros na primeira execução
    - Escolhendo autenticação e assinaturas de provedores
    - Não é possível acessar docs.openclaw.ai, não é possível abrir o painel, instalação travada
sidebarTitle: First-run FAQ
summary: 'Perguntas frequentes: início rápido e configuração da primeira execução — instalação, integração inicial, autenticação, assinaturas, falhas iniciais'
title: 'Perguntas frequentes: configuração da primeira execução'
x-i18n:
    generated_at: "2026-05-02T22:19:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  Início rápido e perguntas e respostas da primeira execução. Para operações do dia a dia, modelos, autenticação, sessões
  e solução de problemas, consulte a [FAQ](/pt-BR/help/faq) principal.

  ## Início rápido e configuração da primeira execução

  <AccordionGroup>
  <Accordion title="Estou travado, a forma mais rápida de destravar">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que perguntar
    no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de configuração ou ambiente** que
    ajudantes remotos não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir sua configuração
    no nível da máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o **checkout completo do código-fonte** por meio
    da instalação hackeável (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, então o agente pode ler o código + a documentação e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar para a versão estável depois
    executando novamente o instalador sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo), depois execute somente os
    comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

    Se você descobrir um bug real ou uma correção, abra uma issue no GitHub ou envie um PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    O que eles fazem:

    - `openclaw status`: instantâneo rápido da saúde do gateway/agente + configuração básica.
    - `openclaw models status`: verifica autenticação de provedores + disponibilidade de modelos.
    - `openclaw doctor`: valida e repara problemas comuns de configuração/estado.

    Outras verificações úteis da CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](/pt-BR/help/faq#first-60-seconds-if-something-is-broken).
    Documentação de instalação: [Instalação](/pt-BR/install), [Flags do instalador](/pt-BR/install/installer), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O Heartbeat continua sendo pulado. O que significam os motivos de pular?">
    Motivos comuns para pular o Heartbeat:

    - `quiet-hours`: fora da janela de horas ativas configurada
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/somente cabeçalho
    - `no-tasks-due`: o modo de tarefas de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos de tarefas venceu ainda
    - `alerts-disabled`: toda a visibilidade do Heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão todos desligados)

    No modo de tarefas, os timestamps de vencimento só avançam depois que uma execução real do Heartbeat
    é concluída. Execuções puladas não marcam tarefas como concluídas.

    Documentação: [Heartbeat](/pt-BR/gateway/heartbeat), [Automação e tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir do código-fonte e usar o onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode compilar os assets da UI automaticamente. Depois do onboarding, você normalmente executa o Gateway na porta **18789**.

    A partir do código-fonte (contribuidores/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se você ainda não tem uma instalação global, execute via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard depois do onboarding?">
    O assistente abre seu navegador com uma URL limpa (sem token) do dashboard logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não abriu, copie/cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard em localhost vs remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se ele pedir autenticação por segredo compartilhado, cole o token ou senha configurado nas configurações da Control UI.
    - Fonte do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Fonte da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se nenhum segredo compartilhado estiver configurado ainda, gere um token com `openclaw doctor --generate-gateway-token`.

    **Não em localhost:**

    - **Tailscale Serve** (recomendado): mantenha o bind em loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, os cabeçalhos de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, pressupõe host do gateway confiável); APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente ingresso privado `none` ou autenticação HTTP de proxy confiável.
      Tentativas simultâneas ruins de autenticação do Serve pelo mesmo cliente são serializadas antes que o limitador de autenticação falha as registre, então a segunda nova tentativa ruim já pode mostrar `retry later`.
    - **Bind tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/`, depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um proxy confiável, configure `gateway.auth.mode: "trusted-proxy"` e então abra a URL do proxy. Proxies de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado ainda se aplica pelo túnel; cole o token ou senha configurado se solicitado.

    Consulte [Dashboard](/pt-BR/web/dashboard) e [Superfícies web](/pt-BR/web) para modos de bind e detalhes de autenticação.

  </Accordion>

  <Accordion title="Por que há duas configurações de aprovação de exec para aprovações por chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha solicitações de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz esse canal atuar como um cliente nativo de aprovação para aprovações de exec

    A política de exec do host ainda é o gate de aprovação real. A configuração de chat só controla onde as solicitações de aprovação
    aparecem e como as pessoas podem respondê-las.

    Na maioria das configurações, você **não** precisa de ambas:

    - Se o chat já oferece suporte a comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo com suporte consegue inferir aprovadores com segurança, o OpenClaw agora habilita automaticamente aprovações nativas primeiro por DM quando `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`.
    - Quando cartões/botões de aprovação nativos estão disponíveis, essa UI nativa é o caminho principal; o agente só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.
    - Use `approvals.exec` somente quando as solicitações também precisarem ser encaminhadas para outros chats ou salas explícitas de operações.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` somente quando você quiser explicitamente que as solicitações de aprovação sejam publicadas de volta na sala/tópico de origem.
    - Aprovações de Plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional por `approvals.plugin`, e apenas alguns canais nativos mantêm tratamento nativo de aprovação de Plugin por cima.

    Versão curta: encaminhamento é para roteamento, configuração de cliente nativo é para uma UX mais rica específica do canal.
    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De qual runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Roda no Raspberry Pi?">
    Sim. O Gateway é leve - a documentação lista **512MB-1GB RAM**, **1 núcleo** e cerca de **500MB**
    em disco como suficientes para uso pessoal, e observa que um **Raspberry Pi 4 consegue executá-lo**.

    Se você quiser folga extra (logs, mídia, outros serviços), **2GB é recomendado**, mas isso
    não é um mínimo obrigatório.

    Dica: um Pi/VPS pequeno pode hospedar o Gateway, e você pode parear **nós** no seu laptop/celular para
    tela/câmera/canvas local ou execução de comandos. Consulte [Nós](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Alguma dica para instalações em Raspberry Pi?">
    Versão curta: funciona, mas espere arestas.

    - Use um SO **64-bit** e mantenha Node >= 22.
    - Prefira a **instalação hackeável (git)** para poder ver logs e atualizar rapidamente.
    - Comece sem canais/Skills, depois adicione um por um.
    - Se você encontrar problemas estranhos de binário, normalmente é um problema de **compatibilidade ARM**.

    Documentação: [Linux](/pt-BR/platforms/linux), [Instalação](/pt-BR/install).

  </Accordion>

  <Accordion title="Está travado em wake up my friend / o onboarding não vai hachar. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente no primeiro hatch. Se você vê essa linha com **nenhuma resposta**
    e os tokens ficam em 0, o agente nunca rodou.

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

    Se o Gateway for remoto, garanta que a conexão por túnel/Tailscale esteja ativa e que a UI
    esteja apontada para o Gateway correto. Consulte [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente igual" (memória, histórico de sessões, autenticação e estado dos canais)
    desde que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver no
    modo remoto, lembre-se de que o host do gateway é dono do armazenamento de sessões e do workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, você está fazendo backup
    de **memória + arquivos de bootstrap**, mas **não** do histórico de sessões nem da autenticação. Esses ficam
    em `~/.openclaw/` (por exemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migração](/pt-BR/install/migrating), [Onde as coisas ficam no disco](/pt-BR/help/faq#where-things-live-on-disk),
    [Workspace do agente](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Modo remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo o que há de novo na versão mais recente?">
    Verifique o changelog do GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais novas ficam no topo. Se a seção superior estiver marcada como **Unreleased**, a próxima seção datada
    é a versão mais recente enviada. As entradas são agrupadas por **Highlights**, **Changes** e
    **Fixes** (além de seções de documentação/outras quando necessário).

  </Accordion>

  <Accordion title="Não consigo acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` via Xfinity
    Advanced Security. Desative isso ou adicione `docs.openclaw.ai` à lista de permissões, depois tente novamente.
    Ajude-nos a desbloquear relatando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se você ainda não conseguir acessar o site, a documentação está espelhada no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre estável e beta">
    **Estável** e **beta** são **dist-tags do npm**, não linhas de código separadas:

    - `latest` = estável
    - `beta` = build antecipada para testes

    Normalmente, uma versão estável chega primeiro em **beta** e, depois, uma etapa explícita
    de promoção move essa mesma versão para `latest`. Mantenedores também podem
    publicar direto em `latest` quando necessário. É por isso que beta e estável podem
    apontar para a **mesma versão** depois da promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para comandos de instalação em uma linha e a diferença entre beta e dev, veja o accordion abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a dist-tag do npm `beta` (pode corresponder a `latest` depois da promoção).
    **Dev** é a ponta móvel de `main` (git); quando publicado, usa a dist-tag do npm `dev`.

    Comandos em uma linha (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador do Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mais detalhes: [Canais de desenvolvimento](/pt-BR/install/development-channels) e [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como experimento os bits mais recentes?">
    Duas opções:

    1. **Canal dev (checkout do git):**

    ```bash
    openclaw update --channel dev
    ```

    Isso troca para o branch `main` e atualiza a partir do código-fonte.

    2. **Instalação modificável (pelo site do instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso fornece um repositório local que você pode editar e depois atualizar via git.

    Se você preferir fazer um clone limpo manualmente, use:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentação: [Atualização](/pt-BR/cli/update), [Canais de desenvolvimento](/pt-BR/install/development-channels),
    [Instalação](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e o onboarding geralmente levam?">
    Guia aproximado:

    - **Instalação:** 2 a 5 minutos
    - **Onboarding:** 5 a 15 minutos, dependendo de quantos canais/modelos você configura

    Se travar, use [Instalador travado](#quick-start-and-first-run-setup)
    e o loop rápido de depuração em [Estou travado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute novamente o instalador com **saída detalhada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalação beta com saída detalhada:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para uma instalação modificável (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente no Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Mais opções: [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows diz que git não foi encontrado ou openclaw não é reconhecido">
    Dois problemas comuns no Windows:

    **1) erro npm spawn git / git não encontrado**

    - Instale o **Git for Windows** e garanta que `git` esteja no seu PATH.
    - Feche e reabra o PowerShell e execute novamente o instalador.

    **2) openclaw não é reconhecido após a instalação**

    - A pasta global de binários do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do seu usuário (sem necessidade do sufixo `\bin` no Windows; na maioria dos sistemas, é `%AppData%\npm`).
    - Feche e reabra o PowerShell depois de atualizar o PATH.

    Se você quer a configuração mais tranquila no Windows, use **WSL2** em vez do Windows nativo.
    Documentação: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto chinês corrompido - o que devo fazer?">
    Isso geralmente é uma incompatibilidade de página de código do console em shells nativos do Windows.

    Sintomas:

    - a saída de `system.run`/`exec` renderiza chinês como mojibake
    - O mesmo comando aparece corretamente em outro perfil de terminal

    Solução rápida no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Em seguida, reinicie o Gateway e tente o comando novamente:

    ```powershell
    openclaw gateway restart
    ```

    Se você ainda reproduzir isso na versão mais recente do OpenClaw, acompanhe/relate em:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="A documentação não respondeu à minha pergunta - como obtenho uma resposta melhor?">
    Use a **instalação modificável (git)** para ter o código-fonte completo e a documentação localmente; depois, pergunte
    ao seu bot (ou Claude/Codex) _a partir dessa pasta_ para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Instalação](/pt-BR/install) e [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia do Linux e depois execute o onboarding.

    - Caminho rápido do Linux + instalação do serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Primeiros passos](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Instalação e atualizações](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em um VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e use SSH/Tailscale para acessar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em cloud/VPS?">
    Mantemos um **hub de hospedagem** com os provedores comuns. Escolha um e siga o guia:

    - [Hospedagem VPS](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como funciona na cloud: o **Gateway roda no servidor**, e você o acessa
    pelo laptop/celular via Control UI (ou Tailscale/SSH). Seu estado + workspace
    ficam no servidor, então trate o host como a fonte da verdade e faça backup dele.

    Você pode parear **nós** (Mac/iOS/Android/headless) com esse Gateway na cloud para acessar
    tela/câmera/canvas locais ou executar comandos no seu laptop enquanto mantém o
    Gateway na cloud.

    Hub: [Plataformas](/pt-BR/platforms). Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).
    Nós: [Nós](/pt-BR/nodes), [CLI de nós](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar?">
    Resposta curta: **possível, não recomendado**. O fluxo de atualização pode reiniciar o
    Gateway (o que derruba a sessão ativa), pode precisar de um checkout git limpo e
    pode pedir confirmação. Mais seguro: execute atualizações a partir de um shell como operador.

    Use a CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se você precisar automatizar a partir de um agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentação: [Atualização](/pt-BR/cli/update), [Atualizando](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho de configuração recomendado. Em **modo local**, ele guia você por:

    - **Configuração de modelo/autenticação** (OAuth de provedor, chaves de API, setup-token da Anthropic, além de opções de modelo local como LM Studio)
    - Local do **workspace** + arquivos de bootstrap
    - **Configurações do Gateway** (bind/porta/autenticação/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de Plugins de canal incluídos, como QQ Bot)
    - **Instalação do daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de integridade** e seleção de **Skills**

    Ele também avisa se o modelo configurado for desconhecido ou não tiver autenticação.

  </Accordion>

  <Accordion title="Preciso de uma assinatura Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outros) ou com
    **modelos somente locais**, para que seus dados fiquem no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são formas opcionais de autenticar esses provedores.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API da Anthropic**: cobrança normal da API da Anthropic
    - **Claude CLI / autenticação de assinatura Claude no OpenClaw**: a equipe da Anthropic
      nos disse que esse uso é permitido novamente, e o OpenClaw está tratando o uso de `claude -p`
      como sancionado para esta integração, a menos que a Anthropic publique uma nova
      política

    Para hosts de gateway de longa duração, chaves de API da Anthropic ainda são a configuração mais
    previsível. O OAuth do OpenAI Codex é explicitamente compatível com ferramentas externas
    como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas no estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentação: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [GLM Models](/pt-BR/providers/glm),
    [Modelos locais](/pt-BR/gateway/local-models), [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar a assinatura Claude Max sem uma chave de API?">
    Sim.

    A equipe da Anthropic nos disse que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então
    o OpenClaw trata a autenticação de assinatura Claude e o uso de `claude -p` como sancionados
    para esta integração, a menos que a Anthropic publique uma nova política. Se você quiser
    a configuração mais previsível do lado do servidor, use uma chave de API da Anthropic.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim.

    A equipe da Anthropic nos disse que esse uso é permitido novamente, então o OpenClaw trata
    a reutilização do Claude CLI e o uso de `claude -p` como sancionados para esta integração,
    a menos que a Anthropic publique uma nova política.

    O setup-token da Anthropic ainda está disponível como um caminho de token compatível com o OpenClaw, mas agora o OpenClaw prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.
    Para cargas de trabalho de produção ou multiusuário, a autenticação por chave de API da Anthropic ainda é a
    escolha mais segura e previsível. Se você quiser outras opções hospedadas no estilo assinatura
    no OpenClaw, veja [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [GLM
    Models](/pt-BR/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
    Isso significa que sua **cota/limite de taxa da Anthropic** está esgotada para a janela atual. Se você
    usa **Claude CLI**, espere a janela ser redefinida ou faça upgrade do seu plano. Se você
    usa uma **chave de API da Anthropic**, verifique o Anthropic Console
    para uso/cobrança e aumente os limites conforme necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, a solicitação está tentando usar
    o beta de contexto de 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial está qualificada para cobrança de contexto longo (cobrança por chave de API ou o
    caminho de login Claude do OpenClaw com Extra Usage habilitado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provedor estiver com limite de taxa.
    Consulte [Modelos](/pt-BR/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="O AWS Bedrock é compatível?">
    Sim. O OpenClaw tem um provedor **Amazon Bedrock (Converse)** incluído. Com marcadores de ambiente AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo de streaming/texto do Bedrock e mesclá-lo como um provedor `amazon-bedrock` implícito; caso contrário, você pode habilitar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada de provedor manual. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Provedores de modelos](/pt-BR/providers/models). Se você preferir um fluxo de chave gerenciada, um proxy compatível com OpenAI na frente do Bedrock ainda é uma opção válida.
  </Accordion>

  <Accordion title="Como a autenticação do Codex funciona?">
    O OpenClaw é compatível com **OpenAI Code (Codex)** via OAuth (login do ChatGPT). Use
    `openai/gpt-5.5` com `agentRuntime.id: "codex"` para a configuração comum:
    autenticação por assinatura ChatGPT/Codex mais execução nativa do servidor de aplicativo Codex. Use
    `openai-codex/gpt-5.5` somente quando quiser OAuth do Codex pelo executor
    PI padrão. Use `openai/gpt-5.5` sem a substituição de runtime do Codex para
    acesso direto por chave de API da OpenAI.
    Consulte [Provedores de modelos](/pt-BR/concepts/model-providers) e [Integração (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o OpenClaw ainda menciona openai-codex?">
    `openai-codex` é o id do provedor e do perfil de autenticação para OAuth do ChatGPT/Codex.
    Ele também é o prefixo explícito do modelo PI para OAuth do Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = autenticação por assinatura ChatGPT/Codex com runtime nativo do Codex
    - `openai-codex/gpt-5.5` = rota OAuth do Codex no PI
    - `openai/gpt-5.5` sem uma substituição de runtime do Codex = rota direta por chave de API da OpenAI no PI
    - `openai-codex:...` = id do perfil de autenticação, não uma referência de modelo

    Se você quiser o caminho direto de cobrança/limite da OpenAI Platform, defina
    `OPENAI_API_KEY`. Se você quiser autenticação por assinatura ChatGPT/Codex, faça login com
    `openclaw models auth login --provider openai-codex`. Para runtime nativo do Codex,
    mantenha a referência de modelo como `openai/gpt-5.5` e defina
    `agentRuntime.id: "codex"`. Use referências de modelo `openai-codex/*` somente para execuções
    PI.

  </Accordion>

  <Accordion title="Por que os limites do OAuth do Codex podem ser diferentes dos da web do ChatGPT?">
    O OAuth do Codex usa janelas de cota gerenciadas pela OpenAI e dependentes do plano. Na prática,
    esses limites podem diferir da experiência no site/aplicativo do ChatGPT, mesmo quando
    ambos estão vinculados à mesma conta.

    O OpenClaw pode mostrar as janelas de uso/cota do provedor visíveis no momento em
    `openclaw models status`, mas ele não inventa nem normaliza direitos do ChatGPT web
    em acesso direto à API. Se você quiser o caminho direto de cobrança/limite da OpenAI Platform, use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura da OpenAI (OAuth do Codex)?">
    Sim. O OpenClaw oferece suporte completo ao **OAuth de assinatura OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth por assinatura em ferramentas/fluxos de trabalho externos
    como o OpenClaw. A integração pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Provedores de modelos](/pt-BR/concepts/model-providers) e [Integração (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth do Gemini CLI?">
    O Gemini CLI usa um **fluxo de autenticação de plugin**, não um id de cliente ou segredo em `openclaw.json`.

    Etapas:

    1. Instale o Gemini CLI localmente para que `gemini` esteja no `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilite o plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após o login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se as solicitações falharem, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway

    Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Provedores de modelos](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local é adequado para conversas casuais?">
    Geralmente, não. O OpenClaw precisa de contexto grande + segurança forte; placas pequenas truncam e vazam. Se for necessário, execute localmente a **maior** build de modelo que puder (LM Studio) e consulte [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de injeção de prompt - consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelos hospedados em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"` para que fallbacks permaneçam disponíveis respeitando o provedor regional selecionado.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw roda no macOS ou Linux (Windows via WSL2). Um Mac mini é opcional - algumas pessoas
    compram um como host sempre ligado, mas um VPS pequeno, servidor doméstico ou máquina da classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) - o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar no Linux ou em outro lugar. Se quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou pareie um nó macOS.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nós](/pt-BR/nodes), [Modo remoto do Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para suporte ao iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages. Ele **não** precisa ser um Mac mini -
    qualquer Mac funciona. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage - o servidor BlueBubbles roda no macOS, enquanto o Gateway pode rodar no Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway no Linux/VPS e execute o servidor BlueBubbles em qualquer Mac conectado ao Messages.
    - Execute tudo no Mac se quiser a configuração mais simples em uma única máquina.

    Documentação: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nós](/pt-BR/nodes),
    [Modo remoto do Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro pode se conectar como um
    **nó** (dispositivo complementar). Nós não executam o Gateway - eles fornecem recursos extras
    como tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ligado).
    - MacBook Pro executa o aplicativo macOS ou um host de nó e pareia com o Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Documentação: [Nós](/pt-BR/nodes), [CLI de nós](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Observamos bugs de runtime, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se ainda quiser experimentar o Bun, faça isso em um gateway que não seja de produção
    sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que entra em allowFrom?">
    `channels.telegram.allowFrom` é **o ID de usuário do Telegram do remetente humano** (numérico). Não é o nome de usuário do bot.

    A configuração pede apenas IDs de usuário numéricos. Se você já tiver entradas legadas `@username` na configuração, `openclaw doctor --fix` pode tentar resolvê-las.

    Mais seguro (sem bot de terceiros):

    - Envie uma DM ao seu bot, depois execute `openclaw logs --follow` e leia `from.id`.

    API oficial de bots:

    - Envie uma DM ao seu bot, depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie uma DM para `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número do WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, via **roteamento multiagente**. Vincule a **DM** do WhatsApp de cada remetente (peer `kind: "direct"`, remetente E.164 como `+15551234567`) a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessão. As respostas ainda vêm da **mesma conta do WhatsApp**, e o controle de acesso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta do WhatsApp. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agente de "chat rápido" e um agente "Opus para codificação"?'>
    Sim. Use roteamento multiagente: dê a cada agente seu próprio modelo padrão e então vincule rotas de entrada (conta do provedor ou peers específicos) a cada agente. Um exemplo de configuração está em [Roteamento multiagente](/pt-BR/concepts/multi-agent). Consulte também [Modelos](/pt-BR/concepts/models) e [Configuração](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim. O Homebrew é compatível com Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, garanta que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo do brew) para que ferramentas instaladas com `brew` sejam resolvidas em shells sem login.
    Builds recentes também prefixam diretórios bin comuns de usuário em serviços systemd no Linux (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação git hackeável e a instalação npm">
    - **Instalação hackeável (git):** checkout completo do código-fonte, editável, ideal para contribuidores.
      Você executa builds localmente e pode corrigir código/documentação.
    - **Instalação npm:** instalação global da CLI, sem repo, ideal para "apenas executar".
      Atualizações vêm de dist-tags do npm.

    Documentação: [Primeiros passos](/pt-BR/start/getting-started), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Use `openclaw update --channel ...` quando o OpenClaw já estiver instalado.
    Isso **não exclui seus dados** - apenas altera a instalação do código do OpenClaw.
    Seu estado (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) permanecem intocados.

    De npm para git:

    ```bash
    openclaw update --channel dev
    ```

    De git para npm:

    ```bash
    openclaw update --channel stable
    ```

    Adicione `--dry-run` para visualizar primeiro a troca de modo planejada. O atualizador executa
    acompanhamentos do Doctor, atualiza as fontes de plugin para o canal de destino e
    reinicia o gateway, a menos que você passe `--no-restart`.

    O instalador também pode forçar qualquer um dos modos:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Dicas de backup: consulte [Estratégia de backup](/pt-BR/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em um VPS?">
    Resposta curta: **se você quer confiabilidade 24/7, use um VPS**. Se você quer a
    menor fricção e não se importa com suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela do navegador ao vivo.
    - **Contras:** suspensão/quedas de rede = desconexões, atualizações/reinicializações do SO interrompem, precisa permanecer ativo.

    **VPS / nuvem**

    - **Prós:** sempre ligado, rede estável, sem problemas de suspensão do laptop, mais fácil de manter em execução.
    - **Contras:** geralmente executa sem interface gráfica (use capturas de tela), somente acesso remoto a arquivos, você precisa usar SSH para atualizações.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem a partir de uma VPS. O único compromisso real é **navegador sem interface gráfica** vs uma janela visível. Veja [Navegador](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões do Gateway antes. Local é ótimo quando você está usando ativamente o Mac e quer acesso a arquivos locais ou automação de interface com um navegador visível.

  </Accordion>

  <Accordion title="Qual é a importância de executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas é **recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ligado, menos interrupções por suspensão/reinicialização, permissões mais limpas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** totalmente adequado para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se você quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e emparelhe seu laptop como um **Node** para ferramentas locais de tela/câmera/execução. Veja [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, vários canais). Ferramentas de Node e automação de navegador podem consumir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação no Linux é mais testado lá.

    Documentação: [Linux](/pt-BR/platforms/linux), [Hospedagem VPS](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa ficar sempre ligada, acessível e ter RAM suficiente
    para o Gateway e quaisquer canais que você habilitar.

    Orientação básica:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar vários canais, automação de navegador ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, **WSL2 é a configuração no estilo VM mais fácil** e tem a melhor compatibilidade
    com ferramentas. Veja [Windows](/pt-BR/platforms/windows), [Hospedagem VPS](/pt-BR/vps).
    Se você estiver executando macOS em uma VM, veja [VM macOS](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionados

- [FAQ](/pt-BR/help/faq) — o FAQ principal (modelos, sessões, gateway, segurança, mais)
- [Visão geral da instalação](/pt-BR/install)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Solução de problemas](/pt-BR/help/troubleshooting)
