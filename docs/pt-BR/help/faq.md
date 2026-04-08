---
read_when:
    - Ao responder perguntas comuns de suporte sobre configuração, instalação, onboarding ou runtime
    - Ao fazer triagem de problemas relatados por usuários antes de depuração mais aprofundada
summary: Perguntas frequentes sobre configuração, instalação e uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-04-08T02:20:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 001b4605966b45b08108606f76ae937ec348c2179b04cf6fb34fef94833705e6
    source_path: help/faq.md
    workflow: 15
---

# Perguntas frequentes

Respostas rápidas mais solução de problemas mais profunda para configurações do mundo real (desenvolvimento local, VPS, multiagente, chaves OAuth/API, failover de modelo). Para diagnósticos de runtime, consulte [Troubleshooting](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuration](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, acessibilidade do gateway/serviço, agentes/sessões, configuração do provider + problemas de runtime (quando o gateway é alcançável).

2. **Relatório copiável (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com tail de log (tokens redigidos).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra o runtime do supervisor vs acessibilidade RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sonda de integridade ao vivo do gateway, incluindo sondas de canal quando suportado
   (requer um gateway alcançável). Consulte [Health](/pt-BR/gateway/health).

5. **Acompanhar o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver indisponível, use como fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logs de arquivo são separados dos logs do serviço; consulte [Logging](/pt-BR/logging) e [Troubleshooting](/pt-BR/gateway/troubleshooting).

6. **Executar o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra config/estado + executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + caminho da config em caso de erro
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Consulte [Health](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

<AccordionGroup>
  <Accordion title="Estou travado, qual é a forma mais rápida de destravar?">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que perguntar
    no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de config ou ambiente**
    que ajudantes remotos não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir
    a configuração da sua máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o
    **checkout completo do código-fonte** por meio da instalação hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, para que o agente possa ler o código + documentação e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar para stable depois
    executando novamente o instalador sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo) e depois executar apenas os
    comandos necessários. Isso mantém as mudanças pequenas e mais fáceis de auditar.

    Se você descobrir um bug ou correção real, abra uma issue no GitHub ou envie um PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Comece com estes comandos (compartilhe as saídas ao pedir ajuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    O que eles fazem:

    - `openclaw status`: snapshot rápido da integridade do gateway/agente + config básica.
    - `openclaw models status`: verifica autenticação do provider + disponibilidade do modelo.
    - `openclaw doctor`: valida e repara problemas comuns de config/estado.

    Outras verificações úteis de CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](#primeiros-60-segundos-se-algo-estiver-quebrado).
    Documentação de instalação: [Install](/pt-BR/install), [Installer flags](/pt-BR/install/installer), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua sendo ignorado. O que significam os motivos de ignorar?">
    Motivos comuns para ignorar heartbeat:

    - `quiet-hours`: fora da janela configurada de horas ativas
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/somente cabeçalhos
    - `no-tasks-due`: o modo de tarefas de `HEARTBEAT.md` está ativo, mas nenhum intervalo de tarefa venceu ainda
    - `alerts-disabled`: toda a visibilidade do heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão desligados)

    No modo de tarefas, timestamps de vencimento só avançam após uma execução real de heartbeat
    ser concluída. Execuções ignoradas não marcam tarefas como concluídas.

    Docs: [Heartbeat](/pt-BR/gateway/heartbeat), [Automation & Tasks](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir do código-fonte e usar onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode compilar automaticamente os assets da UI. Após o onboarding, normalmente você executa o Gateway na porta **18789**.

    A partir do código-fonte (contribuidores/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # instala automaticamente as dependências da UI na primeira execução
    openclaw onboard
    ```

    Se você ainda não tiver uma instalação global, execute via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard após o onboarding?">
    O assistente abre seu navegador com uma URL limpa do dashboard (sem token na URL) logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não abriu, copie/cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard no localhost vs remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se pedir autenticação por segredo compartilhado, cole o token ou senha configurados nas configurações da Control UI.
    - Fonte do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Fonte da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se nenhum segredo compartilhado estiver configurado ainda, gere um token com `openclaw doctor --generate-gateway-token`.

    **Fora do localhost:**

    - **Tailscale Serve** (recomendado): mantenha bind loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, cabeçalhos de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, assumindo host do gateway confiável); APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` em private-ingress ou autenticação HTTP de trusted-proxy.
      Tentativas concorrentes ruins de autenticação Serve do mesmo cliente são serializadas antes que o limitador de autenticação com falha registre, então a segunda tentativa ruim já pode mostrar `retry later`.
    - **Bind tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/` e depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um trusted proxy não-loopback, configure `gateway.auth.mode: "trusted-proxy"` e então abra a URL do proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado ainda se aplica pelo túnel; cole o token ou senha configurados se solicitado.

    Consulte [Dashboard](/web/dashboard) e [Web surfaces](/web) para modos de bind e detalhes de autenticação.

  </Accordion>

  <Accordion title="Por que há duas configs de aprovação de exec para aprovações em chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha prompts de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz esse canal agir como cliente nativo de aprovação para aprovações de exec

    A política de exec do host ainda é o verdadeiro gate de aprovação. A config de chat apenas controla onde prompts de aprovação
    aparecem e como as pessoas podem responder.

    Na maioria das configurações você **não** precisa de ambos:

    - Se o chat já suporta comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo suportado puder inferir aprovadores com segurança, o OpenClaw agora habilita automaticamente aprovações nativas DM-first quando `channels.<channel>.execApprovals.enabled` estiver unset ou `"auto"`.
    - Quando cartões/botões de aprovação nativos estiverem disponíveis, essa UI nativa é o caminho principal; o agente só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações em chat estão indisponíveis ou que aprovação manual é o único caminho.
    - Use `approvals.exec` apenas quando os prompts também precisarem ser encaminhados para outros chats ou salas explícitas de operações.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` apenas quando você quiser explicitamente que prompts de aprovação sejam publicados de volta na sala/tópico de origem.
    - Aprovações de plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional `approvals.plugin` e apenas alguns canais nativos mantêm tratamento nativo de aprovação de plugin por cima.

    Resumindo: encaminhamento é para roteamento; config de cliente nativo é para uma UX mais rica específica do canal.
    Consulte [Exec Approvals](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De qual runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Funciona em Raspberry Pi?">
    Sim. O Gateway é leve — a documentação lista **512MB-1GB de RAM**, **1 núcleo** e cerca de **500MB**
    de disco como suficientes para uso pessoal, e observa que um **Raspberry Pi 4 pode executá-lo**.

    Se você quiser mais folga (logs, mídia, outros serviços), **2GB é recomendado**, mas
    não é um mínimo rígido.

    Dica: um Pi/VPS pequeno pode hospedar o Gateway, e você pode parear **nodes** no seu laptop/celular para
    tela/câmera/canvas local ou execução de comandos. Consulte [Nodes](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Alguma dica para instalações em Raspberry Pi?">
    Resumo: funciona, mas espere algumas arestas.

    - Use um SO **64-bit** e mantenha Node >= 22.
    - Prefira a **instalação hackable (git)** para ver logs e atualizar rapidamente.
    - Comece sem canais/Skills e depois adicione um por um.
    - Se encontrar problemas binários estranhos, normalmente é um problema de **compatibilidade ARM**.

    Docs: [Linux](/pt-BR/platforms/linux), [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Ficou preso em wake up my friend / o onboarding não termina. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente na primeira inicialização. Se você vir essa linha sem **nenhuma resposta**
    e os tokens permanecerem em 0, o agente nunca executou.

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

  <Accordion title="Posso migrar minha configuração para uma máquina nova (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente o mesmo" (memória, histórico de sessão, autenticação e estado do canal)
    desde que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva config, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver em
    modo remoto, lembre-se de que o host do gateway é quem possui o armazenamento de sessão e o workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, estará fazendo backup de
    **memória + arquivos bootstrap**, mas **não** de histórico de sessão ou autenticação. Eles ficam
    em `~/.openclaw/` (por exemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migrating](/pt-BR/install/migrating), [Onde as coisas ficam no disco](#onde-as-coisas-ficam-no-disco),
    [Agent workspace](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Remote mode](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo o que há de novo na versão mais recente?">
    Confira o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais novas ficam no topo. Se a seção do topo estiver marcada como **Unreleased**, a próxima
    seção datada é a versão lançada mais recente. As entradas são agrupadas por **Highlights**, **Changes** e
    **Fixes** (além de docs/outras seções quando necessário).

  </Accordion>

  <Accordion title="Não consigo acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` via Xfinity
    Advanced Security. Desative isso ou coloque `docs.openclaw.ai` na allowlist e tente novamente.
    Ajude-nos a desbloquear isso reportando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ainda não conseguir acessar o site, a documentação é espelhada no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre stable e beta">
    **Stable** e **beta** são **npm dist-tags**, não linhas de código separadas:

    - `latest` = stable
    - `beta` = build inicial para testes

    Normalmente, uma release stable chega primeiro em **beta**, depois uma etapa explícita
    de promoção move essa mesma versão para `latest`. Maintainers também podem
    publicar direto em `latest` quando necessário. É por isso que beta e stable podem
    apontar para a **mesma versão** após a promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para one-liners de instalação e a diferença entre beta e dev, consulte o accordion abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a npm dist-tag `beta` (pode corresponder a `latest` após promoção).
    **Dev** é a cabeça móvel da `main` (git); quando publicada, usa a npm dist-tag `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador Windows (PowerShell):
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

    Isso fornece um repositório local que você pode editar e depois atualizar via git.

    Se você preferir um clone limpo manualmente, use:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/cli/update), [Development channels](/pt-BR/install/development-channels),
    [Install](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e o onboarding normalmente levam?">
    Guia aproximado:

    - **Instalação:** 2-5 minutos
    - **Onboarding:** 5-15 minutos dependendo de quantos canais/modelos você configurar

    Se travar, use [Installer stuck](#inicio-rapido-e-configuracao-da-primeira-execucao)
    e o loop rápido de depuração em [Estou travado](#inicio-rapido-e-configuracao-da-primeira-execucao).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute novamente o instalador com **saída detalhada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalação beta com verbose:

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

    - Instale **Git for Windows** e verifique se `git` está no seu PATH.
    - Feche e reabra o PowerShell, depois execute o instalador novamente.

    **2) openclaw is not recognized após a instalação**

    - Sua pasta global bin do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do usuário (sem sufixo `\bin` no Windows; na maioria dos sistemas é `%AppData%\npm`).
    - Feche e reabra o PowerShell após atualizar o PATH.

    Se você quiser a configuração mais tranquila no Windows, use **WSL2** em vez de Windows nativo.
    Docs: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto chinês corrompido - o que devo fazer?">
    Isso normalmente é uma incompatibilidade de code page do console em shells nativos do Windows.

    Sintomas:

    - a saída de `system.run`/`exec` renderiza chinês como mojibake
    - o mesmo comando parece correto em outro perfil de terminal

    Solução rápida no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Em seguida, reinicie o Gateway e tente novamente o comando:

    ```powershell
    openclaw gateway restart
    ```

    Se você ainda reproduzir isso na versão mais recente do OpenClaw, acompanhe/reporte em:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="A documentação não respondeu minha pergunta - como consigo uma resposta melhor?">
    Use a **instalação hackable (git)** para ter o código-fonte completo e a documentação localmente, depois pergunte
    ao seu bot (ou Claude/Codex) _nessa pasta_ para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Install](/pt-BR/install) e [Installer flags](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia para Linux e depois execute o onboarding.

    - Caminho rápido para Linux + instalação do serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Getting Started](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Install & updates](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para alcançar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remote](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Mantemos um **hub de hospedagem** com os providers comuns. Escolha um e siga o guia:

    - [VPS hosting](/pt-BR/vps) (todos os providers em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como isso funciona na nuvem: o **Gateway é executado no servidor**, e você o acessa
    do laptop/celular pela Control UI (ou Tailscale/SSH). Seu estado + workspace
    vivem no servidor, então trate o host como fonte da verdade e faça backup dele.

    Você pode parear **nodes** (Mac/iOS/Android/headless) com esse Gateway na nuvem para acessar
    tela/câmera/canvas local ou executar comandos no seu laptop enquanto mantém o
    Gateway na nuvem.

    Hub: [Platforms](/pt-BR/platforms). Acesso remoto: [Gateway remote](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar sozinho?">
    Resposta curta: **possível, mas não recomendado**. O fluxo de atualização pode reiniciar o
    Gateway (o que derruba a sessão ativa), pode exigir um checkout git limpo e
    pode pedir confirmação. Mais seguro: executar atualizações a partir de um shell como operador.

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

    Docs: [Update](/cli/update), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho recomendado de configuração. No **modo local** ele orienta você por:

    - **Configuração de modelo/autenticação** (OAuth do provider, chaves de API, setup-token Anthropic, além de opções de modelo local como LM Studio)
    - Localização do **workspace** + arquivos bootstrap
    - **Configurações do Gateway** (bind/porta/auth/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de plugins de canal empacotados como QQ Bot)
    - **Instalação do daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de integridade** e seleção de **Skills**

    Ele também avisa se o modelo configurado é desconhecido ou está sem autenticação.

  </Accordion>

  <Accordion title="Preciso de assinatura Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outros) ou com
    **modelos somente locais** para que seus dados permaneçam no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são formas opcionais de autenticar esses providers.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API Anthropic**: cobrança normal da API Anthropic
    - **Autenticação Claude CLI / assinatura Claude no OpenClaw**: a equipe da Anthropic
      nos informou que esse uso está permitido novamente, e o OpenClaw está tratando o uso de `claude -p`
      como sancionado para essa integração, a menos que a Anthropic publique uma nova
      política

    Para hosts de gateway de longa duração, chaves de API Anthropic ainda são a configuração
    mais previsível. OpenAI Codex OAuth é suportado explicitamente para ferramentas externas
    como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas no estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [GLM Models](/pt-BR/providers/glm),
    [Local models](/pt-BR/gateway/local-models), [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar assinatura Claude Max sem chave de API?">
    Sim.

    A equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw está permitido novamente, então
    o OpenClaw trata a autenticação por assinatura Claude e o uso de `claude -p` como sancionados
    para essa integração, a menos que a Anthropic publique uma nova política. Se você quiser
    a configuração do lado do servidor mais previsível, use uma chave de API Anthropic em vez disso.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim.

    A equipe da Anthropic nos informou que esse uso está permitido novamente, então o OpenClaw trata
    a reutilização do Claude CLI e o uso de `claude -p` como sancionados para esta integração
    a menos que a Anthropic publique uma nova política.

    O setup-token Anthropic ainda está disponível como um caminho de token suportado pelo OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.
    Para workloads de produção ou multiusuário, a autenticação por chave de API Anthropic continua sendo a
    escolha mais segura e previsível. Se você quiser outras opções hospedadas no estilo assinatura
    no OpenClaw, consulte [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [GLM
    Models](/pt-BR/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
Isso significa que sua **cota/limite de taxa da Anthropic** se esgotou na janela atual. Se você
usa **Claude CLI**, espere a janela reiniciar ou faça upgrade do seu plano. Se você
usa uma **chave de API Anthropic**, verifique o Anthropic Console
quanto a uso/faturamento e aumente limites conforme necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, a solicitação está tentando usar
    o beta de contexto 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial é elegível para cobrança de contexto longo (cobrança por chave de API ou o
    caminho de login Claude do OpenClaw com Extra Usage habilitado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provider estiver com rate limit.
    Consulte [Models](/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock é suportado?">
    Sim. O OpenClaw possui um provider empacotado **Amazon Bedrock (Converse)**. Com marcadores de ambiente AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo Bedrock de streaming/texto e mesclá-lo como um provider implícito `amazon-bedrock`; caso contrário, você pode habilitar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada manual de provider. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Model providers](/pt-BR/providers/models). Se preferir um fluxo de chave gerenciado, um proxy compatível com OpenAI na frente do Bedrock continua sendo uma opção válida.
  </Accordion>

  <Accordion title="Como a autenticação do Codex funciona?">
    O OpenClaw oferece suporte ao **OpenAI Code (Codex)** via OAuth (login do ChatGPT). O onboarding pode executar o fluxo OAuth e definirá o modelo padrão como `openai-codex/gpt-5.4` quando apropriado. Consulte [Model providers](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o ChatGPT GPT-5.4 não libera openai/gpt-5.4 no OpenClaw?">
    O OpenClaw trata as duas rotas separadamente:

    - `openai-codex/gpt-5.4` = OAuth do ChatGPT/Codex
    - `openai/gpt-5.4` = API direta da OpenAI Platform

    No OpenClaw, o login do ChatGPT/Codex é conectado à rota `openai-codex/*`,
    não à rota direta `openai/*`. Se você quiser o caminho direto da API no
    OpenClaw, defina `OPENAI_API_KEY` (ou a config equivalente do provider OpenAI).
    Se quiser login ChatGPT/Codex no OpenClaw, use `openai-codex/*`.

  </Accordion>

  <Accordion title="Por que os limites do Codex OAuth podem diferir do ChatGPT web?">
    `openai-codex/*` usa a rota OAuth do Codex, e suas janelas de cota utilizáveis são
    gerenciadas pela OpenAI e dependem do plano. Na prática, esses limites podem diferir da
    experiência no site/app do ChatGPT, mesmo quando ambos estão vinculados à mesma conta.

    O OpenClaw pode mostrar as janelas de uso/cota do provider atualmente visíveis em
    `openclaw models status`, mas ele não inventa nem normaliza direitos do ChatGPT web
    em acesso direto à API. Se você quiser o caminho direto de cobrança/limite da OpenAI Platform,
    use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Vocês oferecem suporte à autenticação por assinatura OpenAI (Codex OAuth)?">
    Sim. O OpenClaw oferece suporte total a **OAuth de assinatura do OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth de assinatura em ferramentas/workflows externos
    como o OpenClaw. O onboarding pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Model providers](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o Gemini CLI OAuth?">
    O Gemini CLI usa um **fluxo de autenticação de plugin**, não um client id ou secret em `openclaw.json`.

    Passos:

    1. Instale o Gemini CLI localmente para que `gemini` esteja no `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilite o plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se as requisições falharem, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway

    Isso armazena tokens OAuth em perfis de autenticação no host do gateway. Detalhes: [Model providers](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local serve para conversas casuais?">
    Normalmente não. O OpenClaw precisa de contexto grande + segurança forte; placas pequenas truncam e vazam. Se precisar, execute a **maior** build de modelo que conseguir localmente (LM Studio) e veja [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de injeção de prompt — consulte [Security](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelo hospedado em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; selecione a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"` para que os fallbacks continuem disponíveis enquanto respeitam o provider regional selecionado.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw funciona em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional — algumas pessoas
    compram um como host sempre ativo, mas uma VPS pequena, servidor doméstico ou máquina classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) — o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar em Linux ou outro lugar. Se você quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou pareie um node macOS.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes), [Mac remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para suporte ao iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages. **Não** precisa ser um Mac mini —
    qualquer Mac funciona. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage — o servidor BlueBubbles roda no macOS, enquanto o Gateway pode rodar em Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway em Linux/VPS e execute o servidor BlueBubbles em qualquer Mac conectado ao Messages.
    - Execute tudo no Mac se quiser a configuração mais simples em uma única máquina.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes),
    [Mac remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e o seu MacBook Pro pode se conectar como
    **node** (dispositivo complementar). Nodes não executam o Gateway — eles fornecem capacidades extras
    como tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ativo).
    - MacBook Pro executa o app macOS ou um node host e se pareia ao Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Docs: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Vemos bugs de runtime, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se ainda quiser experimentar Bun, faça isso em um gateway não produtivo
    sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que vai em allowFrom?">
    `channels.telegram.allowFrom` é **o ID de usuário do Telegram do remetente humano** (numérico). Não é o username do bot.

    O onboarding aceita entrada `@username` e a resolve para um ID numérico, mas a autorização do OpenClaw usa apenas IDs numéricos.

    Mais seguro (sem bot de terceiro):

    - Envie DM ao seu bot, depois execute `openclaw logs --follow` e leia `from.id`.

    API oficial do Bot:

    - Envie DM ao seu bot, depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie DM para `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número do WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, via **roteamento multiagente**. Vincule a **DM** de WhatsApp de cada remetente (peer `kind: "direct"`, E.164 do remetente como `+15551234567`) a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessão. As respostas ainda virão da **mesma conta do WhatsApp**, e o controle de acesso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta do WhatsApp. Consulte [Multi-Agent Routing](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agente de "chat rápido" e um agente "Opus para programação"?'>
    Sim. Use roteamento multiagente: dê a cada agente seu próprio modelo padrão e então vincule rotas de entrada (conta do provider ou peers específicos) a cada agente. Um exemplo de configuração está em [Multi-Agent Routing](/pt-BR/concepts/multi-agent). Consulte também [Models](/pt-BR/concepts/models) e [Configuration](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim. O Homebrew oferece suporte a Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, garanta que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo brew) para que ferramentas instaladas com `brew` sejam resolvidas em shells sem login.
    Builds recentes também preprendem diretórios bin comuns de usuário em serviços systemd no Linux (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação hackable via git e npm install">
    - **Instalação hackable (git):** checkout completo do código-fonte, editável, melhor para contribuidores.
      Você executa builds localmente e pode alterar código/docs.
    - **npm install:** instalação global da CLI, sem repositório, melhor para "apenas executar".
      As atualizações vêm de npm dist-tags.

    Docs: [Getting started](/pt-BR/start/getting-started), [Updating](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Instale a outra variante, depois execute Doctor para que o serviço do gateway aponte para o novo entrypoint.
    Isso **não apaga seus dados** — apenas muda a instalação do código do OpenClaw. Seu estado
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

    Dicas de backup: consulte [Estratégia de backup](#onde-as-coisas-ficam-no-disco).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em uma VPS?">
    Resposta curta: **se você quiser confiabilidade 24/7, use uma VPS**. Se quiser o
    menor atrito e estiver tudo bem com suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela do navegador visível.
    - **Contras:** suspensão/queda de rede = desconexões, atualizações/reinicializações do SO interrompem, precisa ficar acordado.

    **VPS / nuvem**

    - **Prós:** sempre ligado, rede estável, sem problemas de suspensão do laptop, mais fácil manter executando.
    - **Contras:** geralmente sem interface (use screenshots), acesso remoto apenas a arquivos, você precisa usar SSH para atualizar.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem a partir de uma VPS. A única compensação real é **navegador headless** vs janela visível. Consulte [Browser](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões do gateway antes. Local é ótimo quando você está usando ativamente o Mac e quer acesso a arquivos locais ou automação de UI com navegador visível.

  </Accordion>

  <Accordion title="Quão importante é executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas **recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ativo, menos interrupções por suspensão/reinicialização, permissões mais limpas, mais fácil manter em execução.
    - **Laptop/desktop compartilhado:** perfeitamente ok para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se quiser o melhor dos dois mundos, mantenha o Gateway em um host dedicado e pareie seu laptop como **node** para ferramentas locais de tela/câmera/exec. Consulte [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, múltiplos canais). Ferramentas de node e automação de navegador podem consumir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação em Linux é melhor testado nesses sistemas.

    Docs: [Linux](/pt-BR/platforms/linux), [VPS hosting](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa estar sempre ligada, acessível e ter RAM suficiente
    para o Gateway e quaisquer canais que você habilitar.

    Orientação básica:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar múltiplos canais, automação de navegador ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, **WSL2 é a configuração estilo VM mais fácil** e com melhor
    compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [VPS hosting](/pt-BR/vps).
    Se estiver executando macOS em uma VM, consulte [macOS VM](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## O que é OpenClaw?

<AccordionGroup>
  <Accordion title="O que é OpenClaw, em um parágrafo?">
    O OpenClaw é um assistente de IA pessoal que você executa em seus próprios dispositivos. Ele responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugins de canal empacotados, como QQ Bot) e também pode fazer voz + um Canvas ao vivo em plataformas suportadas. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    O OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle local-first** que permite executar um
    assistente capaz em **seu próprio hardware**, acessível pelos apps de chat que você já usa, com
    sessões com estado, memória e ferramentas — sem entregar o controle dos seus fluxos de trabalho a um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessão locais.
    - **Canais reais, não uma sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      além de voz em celular e Canvas em plataformas compatíveis.
    - **Agnóstico a modelo:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento
      por agente e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam permanecer no seu dispositivo** se quiser.
    - **Roteamento multiagente:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Open source e hackable:** inspecione, estenda e faça self-host sem lock-in de fornecedor.

    Docs: [Gateway](/pt-BR/gateway), [Channels](/pt-BR/channels), [Multi-agent](/pt-BR/concepts/multi-agent),
    [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar - o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um site (WordPress, Shopify ou um site estático simples).
    - Prototipar um app móvel (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, tags).
    - Conectar Gmail e automatizar resumos ou acompanhamentos.

    Ele pode lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa subagentes para trabalho paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidianos do OpenClaw?">
    Ganhos cotidianos normalmente se parecem com:

    - **Briefings pessoais:** resumos da caixa de entrada, calendário e notícias que importam para você.
    - **Pesquisa e rascunho:** pesquisa rápida, resumos e primeiros rascunhos para emails ou docs.
    - **Lembretes e acompanhamentos:** notificações e checklists guiados por cron ou heartbeat.
    - **Automação de navegador:** preencher formulários, coletar dados e repetir tarefas web.
    - **Coordenação entre dispositivos:** envie uma tarefa do celular, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com lead gen, outreach, anúncios e blogs para um SaaS?">
    Sim, para **pesquisa, qualificação e rascunho**. Ele pode analisar sites, montar listas curtas,
    resumir prospects e escrever rascunhos de outreach ou cópia para anúncios.

    Para **outreach ou campanhas de anúncios**, mantenha um humano no circuito. Evite spam, siga leis locais e
    políticas de plataforma, e revise tudo antes de enviar. O padrão mais seguro é deixar
    o OpenClaw rascunhar e você aprovar.

    Docs: [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em comparação com Claude Code para desenvolvimento web?">
    O OpenClaw é um **assistente pessoal** e camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop mais rápido de programação direta dentro de um repositório. Use OpenClaw quando quiser
    memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória + workspace persistentes** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ativo** (execute em uma VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/exec local

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem sujar o repositório?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → empacotado → `skills.load.extraDirs`, então substituições gerenciadas ainda vencem as Skills empacotadas sem tocar no git. Se você precisar da Skill instalada globalmente, mas visível apenas para alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Apenas edições dignas de upstream devem ficar no repositório e sair como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras via `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (menor precedência). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → empacotado → `skills.load.extraDirs`. `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill só deve ser visível para certos agentes, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos diferentes para tarefas diferentes?">
    Hoje, os padrões suportados são:

    - **Jobs cron**: jobs isolados podem definir uma sobrescrita `model` por job.
    - **Subagentes**: roteie tarefas para agentes separados com modelos padrão diferentes.
    - **Troca sob demanda**: use `/model` para trocar o modelo da sessão atual a qualquer momento.

    Consulte [Cron jobs](/pt-BR/automation/cron-jobs), [Multi-Agent Routing](/pt-BR/concepts/multi-agent) e [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot congela ao fazer trabalho pesado. Como descarrego isso?">
    Use **subagentes** para tarefas longas ou paralelas. Subagentes executam em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao seu bot para "spawn a sub-agent for this task" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo agora (e se está ocupado).

    Dica de tokens: tarefas longas e subagentes consomem tokens. Se custo for uma preocupação, defina um
    modelo mais barato para subagentes via `agents.defaults.subagents.model`.

    Docs: [Sub-agents](/pt-BR/tools/subagents), [Background Tasks](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam sessões de subagente vinculadas a thread no Discord?">
    Use vinculações de thread. Você pode vincular uma thread do Discord a um subagente ou destino de sessão para que mensagens subsequentes nessa thread permaneçam nessa sessão vinculada.

    Fluxo básico:

    - Gere com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para continuidade persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado da vinculação.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o desfoco automático.
    - Use `/unfocus` para desvincular a thread.

    Configuração necessária:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescritas do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculação automática ao gerar: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Sub-agents](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Configuration Reference](/pt-BR/gateway/configuration-reference), [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota de solicitante resolvida:

    - A entrega de subagente em modo de conclusão prefere qualquer thread vinculada ou rota de conversa quando existir.
    - Se a origem da conclusão carregar apenas um canal, o OpenClaw recua para a rota armazenada da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa funcionar.
    - Se não existir nem rota vinculada nem rota armazenada utilizável, a entrega direta pode falhar e o resultado recua para entrega enfileirada por sessão em vez de ser publicado imediatamente no chat.
    - Alvos inválidos ou obsoletos ainda podem forçar fallback para fila ou falha final de entrega.
    - Se a última resposta visível do assistente do filho for exatamente o token silencioso `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, o OpenClaw suprime intencionalmente o anúncio em vez de publicar progresso anterior obsoleto.
    - Se o filho tiver atingido timeout após apenas chamadas de ferramentas, o anúncio pode condensar isso em um pequeno resumo de progresso parcial em vez de reproduzir a saída bruta das ferramentas.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-agents](/pt-BR/tools/subagents), [Background Tasks](/pt-BR/automation/tasks), [Session Tools](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    O cron roda dentro do processo do Gateway. Se o Gateway não estiver executando continuamente,
    jobs agendados não serão executados.

    Checklist:

    - Confirme que cron está habilitado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está rodando 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário do job (`--tz` vs fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/pt-BR/automation/cron-jobs), [Automation & Tasks](/pt-BR/automation).

  </Accordion>

  <Accordion title="O cron disparou, mas nada foi enviado ao canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que nenhuma mensagem externa é esperada.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o executor ignorou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o executor tentou entregar, mas as credenciais bloquearam.
    - Um resultado isolado silencioso (`NO_REPLY` / `no_reply` apenas) é tratado como intencionalmente não entregável, então o executor também suprime a entrega de fallback enfileirada.

    Para jobs cron isolados, o executor é responsável pela entrega final. Espera-se
    que o agente retorne um resumo em texto simples para que o executor envie. `--no-deliver` mantém
    esse resultado interno; não permite que o agente envie diretamente com a
    ferramenta de mensagem.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/pt-BR/automation/cron-jobs), [Background Tasks](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução cron isolada trocou de modelo ou tentou novamente uma vez?">
    Isso normalmente é o caminho de troca de modelo ao vivo, não agendamento duplicado.

    Cron isolado pode persistir uma transferência de modelo de runtime e tentar novamente quando a execução ativa
    lançar `LiveSessionModelSwitchError`. A nova tentativa mantém o
    provider/modelo trocado, e se a troca trouxe uma nova sobrescrita de perfil de autenticação, o cron
    persiste isso também antes de tentar novamente.

    Regras de seleção relacionadas:

    - Sobrescrita de modelo do hook do Gmail vence primeiro quando aplicável.
    - Depois `model` por job.
    - Depois qualquer sobrescrita de modelo armazenada na sessão cron.
    - Depois a seleção normal de modelo padrão/agente.

    O loop de nova tentativa é limitado. Após a tentativa inicial mais 2 novas tentativas de troca,
    o cron aborta em vez de entrar em loop infinito.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron jobs](/pt-BR/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use comandos nativos `openclaw skills` ou coloque Skills no seu workspace. A UI de Skills do macOS não está disponível no Linux.
    Navegue pelas Skills em [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    A instalação nativa `openclaw skills install` grava no diretório `skills/`
    do workspace ativo. Instale a CLI separada `clawhub` apenas se quiser publicar ou
    sincronizar suas próprias Skills. Para instalações compartilhadas entre agentes, coloque a Skill em
    `~/.openclaw/skills` e use `agents.defaults.skills` ou
    `agents.list[].skills` se quiser restringir quais agentes podem vê-la.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas em um agendamento ou continuamente em segundo plano?">
    Sim. Use o agendador do Gateway:

    - **Jobs cron** para tarefas agendadas ou recorrentes (persistem entre reinicializações).
    - **Heartbeat** para verificações periódicas da "sessão principal".
    - **Jobs isolados** para agentes autônomos que publicam resumos ou entregam em chats.

    Docs: [Cron jobs](/pt-BR/automation/cron-jobs), [Automation & Tasks](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do macOS Apple a partir do Linux?">
    Não diretamente. Skills de macOS são controladas por `metadata.openclaw.os` mais os binários necessários, e Skills só aparecem no prompt do sistema quando são elegíveis no **host do Gateway**. No Linux, Skills somente-`darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas a menos que você sobrescreva esse controle.

    Você tem três padrões suportados:

    **Opção A - executar o Gateway em um Mac (mais simples).**
    Execute o Gateway onde os binários do macOS existem, depois conecte-se do Linux em [modo remoto](#gateway-portas-ja-em-execucao-e-modo-remoto) ou por Tailscale. As Skills carregam normalmente porque o host do Gateway é macOS.

    **Opção B - usar um node macOS (sem SSH).**
    Execute o Gateway em Linux, pareie um node macOS (app da barra de menus) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários necessários existirem no node. O agente executa essas Skills via a ferramenta `nodes`. Se você escolher "Always Ask", aprovar "Always Allow" no prompt adiciona esse comando à allowlist.

    **Opção C - fazer proxy de binários do macOS por SSH (avançado).**
    Mantenha o Gateway em Linux, mas faça os binários CLI necessários resolverem para wrappers SSH que executam em um Mac. Depois sobrescreva a Skill para permitir Linux, para que ela continue elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloque o wrapper no `PATH` do host Linux (por exemplo `~/bin/memo`).
    3. Sobrescreva os metadados da Skill (workspace ou `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicie uma nova sessão para atualizar o snapshot de Skills.

  </Accordion>

  <Accordion title="Vocês têm integração com Notion ou HeyGen?">
    Não integrada hoje.

    Opções:

    - **Skill / plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen ambos têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se você quiser manter contexto por cliente (workflows de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Pedir ao agente para buscar essa página no início de uma sessão.

    Se quiser uma integração nativa, abra uma solicitação de recurso ou crie uma Skill
    direcionada a essas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas vão para o diretório `skills/` do workspace ativo. Para Skills compartilhadas entre agentes, coloque-as em `~/.openclaw/skills/<name>/SKILL.md`. Se apenas alguns agentes devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam binários instalados via Homebrew; no Linux isso significa Linuxbrew (veja a entrada de FAQ do Homebrew Linux acima). Consulte [Skills](/pt-BR/tools/skills), [Skills config](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome já autenticado com o OpenClaw?">
    Use o perfil de navegador `user` integrado, que se conecta via Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho é local ao host. Se o Gateway estiver em outro lugar, execute um node host na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - ações são dirigidas por ref, não por seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente suportam um arquivo por vez
    - `responsebody`, exportação em PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação dedicada a sandboxing?">
    Sim. Consulte [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica de Docker (gateway completo em Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado - como habilito recursos completos?">
    A imagem padrão prioriza segurança e executa como o usuário `node`, portanto não
    inclui pacotes de sistema, Homebrew ou navegadores empacotados. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que caches sobrevivam.
    - Incorpore dependências de sistema na imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instale navegadores Playwright pela CLI empacotada:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Docs: [Docker](/pt-BR/install/docker), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/em sandbox com um único agente?">
    Sim — se seu tráfego privado for em **DMs** e seu tráfego público em **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves não principais) rodem em Docker, enquanto a sessão principal de DM permanece no host. Depois restrinja quais ferramentas estão disponíveis em sessões sandboxed via `tools.sandbox.tools`.

    Passo a passo da configuração + exemplo: [Groups: personal DMs + public groups](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência principal de configuração: [Gateway configuration](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host na sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por exemplo `"/home/user/src:/src:ro"`). Os binds globais + por agente se mesclam; binds por agente são ignorados quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que binds contornam as paredes do sistema de arquivos da sandbox.

    O OpenClaw valida fontes de bind tanto contra o caminho normalizado quanto contra o caminho canônico resolvido pelo ancestral existente mais profundo. Isso significa que escapes por pai-symlink ainda falham de forma fail-closed mesmo quando o último segmento do caminho ainda não existe, e as verificações de raiz permitida ainda se aplicam após a resolução de symlink.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e observações de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw é apenas arquivos Markdown no workspace do agente:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas curadas de longo prazo em `MEMORY.md` (apenas sessões principais/privadas)

    O OpenClaw também executa um **flush silencioso de memória pré-compaction** para lembrar o modelo
    de gravar notas duráveis antes da compactação automática. Isso só é executado quando o workspace
    é gravável (sandboxes somente leitura ignoram isso). Consulte [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para fixar?">
    Peça ao bot para **escrever o fato na memória**. Notas de longo prazo pertencem a `MEMORY.md`,
    contexto de curto prazo vai para `memory/YYYY-MM-DD.md`.

    Essa ainda é uma área que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
    ele saberá o que fazer. Se ele continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Docs: [Memory](/pt-BR/concepts/memory), [Agent workspace](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Arquivos de memória vivem no disco e persistem até você apagá-los. O limite é seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto
    do modelo, então conversas longas podem compactar ou truncar. É por isso
    que existe busca de memória — ela traz apenas as partes relevantes de volta ao contexto.

    Docs: [Memory](/pt-BR/concepts/memory), [Context](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica de memória exige uma chave de API OpenAI?">
    Só se você usar **embeddings OpenAI**. Codex OAuth cobre chat/completions e
    **não** concede acesso a embeddings, então **entrar com Codex (OAuth ou login
    do Codex CLI)** não ajuda na busca semântica de memória. Embeddings OpenAI
    ainda exigem uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir explicitamente um provider, o OpenClaw seleciona automaticamente um provider quando ele
    consegue resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou variáveis de ambiente).
    Ele prefere OpenAI se uma chave OpenAI for resolvida, caso contrário Gemini se uma chave Gemini
    for resolvida, depois Voyage e depois Mistral. Se nenhuma chave remota estiver disponível, a
    busca de memória permanece desativada até você configurá-la. Se você tiver um caminho de modelo local
    configurado e presente, o OpenClaw
    prefere `local`. Ollama é suportado quando você define explicitamente
    `memorySearch.provider = "ollama"`.

    Se preferir permanecer local, defina `memorySearch.provider = "local"` (e opcionalmente
    `memorySearch.fallback = "none"`). Se quiser embeddings Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Oferecemos suporte a modelos de embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama ou local**
    — consulte [Memory](/pt-BR/concepts/memory) para detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com OpenClaw são salvos localmente?">
    Não — **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia a eles**.

    - **Local por padrão:** sessões, arquivos de memória, config e workspace vivem no host do Gateway
      (`~/.openclaw` + seu diretório de workspace).
    - **Remoto por necessidade:** mensagens que você envia para providers de modelo (Anthropic/OpenAI/etc.) vão para
      as APIs deles, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagem em seus
      servidores.
    - **Você controla a pegada:** usar modelos locais mantém prompts na sua máquina, mas o
      tráfego de canal ainda passa pelos servidores do canal.

    Relacionado: [Agent workspace](/pt-BR/concepts/agent-workspace), [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                        | Finalidade                                                         |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Config principal (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Importação OAuth legada (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Payload opcional de segredo em arquivo para providers SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Arquivo de compatibilidade legado (entradas estáticas `api_key` higienizadas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Estado do provider (ex.: `whatsapp/<accountId>/creds.json`)        |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Estado por agente (agentDir + sessões)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Histórico e estado de conversa (por agente)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadados de sessão (por agente)                                   |

    Caminho legado de agente único: `~/.openclaw/agent/*` (migrado por `openclaw doctor`).

    Seu **workspace** (`AGENTS.md`, arquivos de memória, Skills etc.) é separado e configurado via `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde devem ficar AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Esses arquivos ficam no **workspace do agente**, não em `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou fallback legado `memory.md` quando `MEMORY.md` estiver ausente),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Diretório de estado (`~/.openclaw`)**: config, estado de canal/provider, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquecer" após uma reinicialização, confirme se o Gateway está usando o mesmo
    workspace em todas as inicializações (e lembre-se: o modo remoto usa o workspace do **host do gateway**,
    não o do seu laptop local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **escrever isso em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Agent workspace](/pt-BR/concepts/agent-workspace) e [Memory](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agente** em um repositório git **privado** e faça backup dele em algum lugar
    privado (por exemplo GitHub privado). Isso captura memória + arquivos AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente depois.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens ou payloads criptografados de segredos).
    Se você precisar de uma restauração completa, faça backup do workspace e do diretório de estado
    separadamente (consulte a pergunta sobre migração acima).

    Docs: [Agent workspace](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Uninstall](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Agentes podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e âncora da memória, não uma sandbox rígida.
    Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que sandboxing esteja habilitado. Se precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agente. Se você
    quiser que um repositório seja o diretório de trabalho padrão, aponte o
    `workspace` desse agente para a raiz do repositório. O repositório OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você intencionalmente queira que o agente trabalhe dentro dele.

    Exemplo (repositório como cwd padrão):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: onde fica o armazenamento de sessão?">
    O estado da sessão pertence ao **host do gateway**. Se você estiver em modo remoto, o armazenamento de sessão que importa está na máquina remota, não no seu laptop local. Consulte [Session management](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de config

<AccordionGroup>
  <Accordion title="Qual é o formato da config? Onde ela fica?">
    O OpenClaw lê uma config opcional em **JSON5** de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se o arquivo estiver ausente, ele usa padrões razoavelmente seguros (incluindo um workspace padrão de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Defini gateway.bind: "lan" (ou "tailnet") e agora nada escuta / a UI diz unauthorized'>
    Binds não-loopback **exigem um caminho válido de autenticação do gateway**. Na prática isso significa:

    - autenticação por segredo compartilhado: token ou senha
    - `gateway.auth.mode: "trusted-proxy"` atrás de um proxy reverso com reconhecimento de identidade não-loopback corretamente configurado

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Observações:

    - `gateway.remote.token` / `.password` **não** habilitam autenticação do gateway local por conta própria.
    - Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` estiver unset.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fail-closed (sem fallback remoto mascarando).
    - Configurações da Control UI com segredo compartilhado autenticam via `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/UI). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de requisição. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos loopback no mesmo host ainda **não** satisfazem autenticação trusted-proxy. O trusted proxy deve ser uma fonte não-loopback configurada.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw impõe autenticação do gateway por padrão, inclusive em loopback. No caminho padrão normal isso significa autenticação por token: se nenhum caminho explícito de autenticação for configurado, a inicialização do gateway resolve para o modo token e gera automaticamente um, salvando-o em `gateway.auth.token`, então **clientes WS locais precisam autenticar**. Isso impede que outros processos locais chamem o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo senha (ou, para proxies reversos com reconhecimento de identidade não-loopback, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina `gateway.auth.mode: "none"` explicitamente na sua config. O Doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar após mudar a config?">
    O Gateway observa a config e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): aplica alterações seguras a quente, reinicia para as críticas
    - `hot`, `restart`, `off` também são suportados

  </Accordion>

  <Accordion title="Como desativo slogans engraçados da CLI?">
    Defina `cli.banner.taglineMode` na config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta o texto do slogan, mas mantém a linha de título/versão do banner.
    - `default`: usa `All your chats, one OpenClaw.` todas as vezes.
    - `random`: slogans rotativos engraçados/sazonais (comportamento padrão).
    - Se você não quiser banner nenhum, defina a env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito busca na web (e web fetch)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do
    provider selecionado:

    - Providers com API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily, exigem a configuração normal de chave de API.
    - Ollama Web Search não exige chave, mas usa o host Ollama configurado e requer `ollama signin`.
    - DuckDuckGo não exige chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG não exige chave/é self-hosted; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provider.
    Alternativas por ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // opcional; omita para auto-detecção
            },
          },
        },
    }
    ```

    A configuração específica do provider para busca na web agora fica em `plugins.entries.<plugin>.config.webSearch.*`.
    Caminhos legados de provider em `tools.web.search.*` ainda são carregados temporariamente para compatibilidade, mas não devem ser usados em novas configs.
    A configuração de fallback de web-fetch do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usa allowlists, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` é habilitado por padrão (a menos que seja desabilitado explicitamente).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provider de fallback de fetch pronto a partir das credenciais disponíveis. Hoje o provider empacotado é Firecrawl.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Docs: [Web tools](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha config. Como recupero e evito isso?">
    `config.apply` substitui a **config inteira**. Se você enviar um objeto parcial, todo o
    restante será removido.

    Recuperação:

    - Restaure a partir de backup (git ou uma cópia de `~/.openclaw/openclaw.json`).
    - Se você não tiver backup, execute `openclaw doctor` novamente e reconfigure canais/modelos.
    - Se isso foi inesperado, registre um bug e inclua sua última config conhecida ou qualquer backup.
    - Um agente de programação local muitas vezes consegue reconstruir uma config funcional a partir de logs ou histórico.

    Como evitar:

    - Use `openclaw config set` para pequenas mudanças.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando não tiver certeza sobre um caminho exato ou formato de campo; ele retorna um nó de esquema superficial mais resumos dos filhos imediatos para navegação detalhada.
    - Use `config.patch` para edições RPC parciais; mantenha `config.apply` apenas para substituição total da config.
    - Se você estiver usando a ferramenta `gateway` somente para owner em uma execução de agente, ela ainda rejeitará gravações em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que normalizam para os mesmos caminhos protegidos de exec).

    Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    O padrão comum é **um Gateway** (por exemplo, Raspberry Pi) mais **nodes** e **agentes**:

    - **Gateway (central):** possui canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos):** Macs/iOS/Android conectam como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cérebros/workspaces separados para papéis especiais (por exemplo, "Hetzner ops", "Personal data").
    - **Subagentes:** geram trabalho em segundo plano a partir de um agente principal quando você quer paralelismo.
    - **TUI:** conecta ao Gateway e alterna agentes/sessões.

    Docs: [Nodes](/pt-BR/nodes), [Remote access](/pt-BR/gateway/remote), [Multi-Agent Routing](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode rodar headless?">
    Sim. É uma opção de config:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    O padrão é `false` (com interface). O modo headless tem maior probabilidade de acionar verificações anti-bot em alguns sites. Consulte [Browser](/pt-BR/tools/browser).

    O modo headless usa o **mesmo mecanismo Chromium** e funciona para a maior parte da automação (formulários, cliques, scraping, logins). As principais diferenças:

    - Não há janela visível do navegador (use screenshots se precisar de visuais).
    - Alguns sites são mais rígidos com automação em modo headless (CAPTCHAs, anti-bot).
      Por exemplo, X/Twitter costuma bloquear sessões headless.

  </Accordion>

  <Accordion title="Como uso Brave para controle do navegador?">
    Defina `browser.executablePath` para o binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
    Consulte os exemplos completos de config em [Browser](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos e nodes

<AccordionGroup>
  <Accordion title="Como os comandos se propagam entre Telegram, o gateway e nodes?">
    As mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
    só depois chama nodes pelo **Gateway WebSocket** quando uma ferramenta de node é necessária:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes não veem tráfego de provider de entrada; eles só recebem chamadas RPC de node.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway está hospedado remotamente?">
    Resposta curta: **pareie seu computador como um node**. O Gateway roda em outro lugar, mas pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo Gateway WebSocket.

    Configuração típica:

    1. Execute o Gateway no host sempre ativo (VPS/servidor doméstico).
    2. Coloque o host do Gateway + seu computador na mesma tailnet.
    3. Garanta que o WS do Gateway esteja alcançável (bind tailnet ou túnel SSH).
    4. Abra o app macOS localmente e conecte-se em modo **Remote over SSH** (ou tailnet direto)
       para que ele possa registrar-se como node.
    5. Aprove o node no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Não é necessário um bridge TCP separado; nodes conectam pelo Gateway WebSocket.

    Lembrete de segurança: parear um node macOS permite `system.run` nessa máquina. Pareie apenas
    dispositivos em que você confia e revise [Security](/pt-BR/gateway/security).

    Docs: [Nodes](/pt-BR/nodes), [Gateway protocol](/pt-BR/gateway/protocol), [macOS remote mode](/pt-BR/platforms/mac/remote), [Security](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - Gateway está em execução: `openclaw gateway status`
    - Integridade do Gateway: `openclaw status`
    - Integridade dos canais: `openclaw channels status`

    Depois verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, confirme que `gateway.auth.allowTailscale` está definido corretamente.
    - Se você conecta via túnel SSH, confirme que o túnel local está ativo e aponta para a porta certa.
    - Confirme que suas allowlists (DM ou grupo) incluem sua conta.

    Docs: [Tailscale](/pt-BR/gateway/tailscale), [Remote access](/pt-BR/gateway/remote), [Channels](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não existe bridge "bot-para-bot" integrado, mas você pode conectá-los de algumas
    formas confiáveis:

    **Mais simples:** use um canal de chat normal ao qual ambos os bots tenham acesso (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem ao Bot B e então deixe o Bot B responder normalmente.

    **Bridge por CLI (genérico):** execute um script que chame o outro Gateway com
    `openclaw agent --message ... --deliver`, mirando um chat onde o outro bot
    escuta. Se um bot estiver em uma VPS remota, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Remote access](/pt-BR/gateway/remote)).

    Padrão de exemplo (execute de uma máquina que consegue alcançar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione uma proteção para que os dois bots não entrem em loop infinito (somente menção, 
    allowlists de canal ou uma regra "não responder a mensagens de bot").

    Docs: [Remote access](/pt-BR/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para múltiplos agentes?">
    Não. Um Gateway pode hospedar vários agentes, cada um com seu próprio workspace, padrões de modelo
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    uma VPS por agente.

    Use VPSs separadas apenas quando precisar de isolamento rígido (limites de segurança) ou configs
    muito diferentes que você não queira compartilhar. Caso contrário, mantenha um Gateway e
    use múltiplos agentes ou subagentes.

  </Accordion>

  <Accordion title="Existe vantagem em usar um node no meu laptop pessoal em vez de SSH a partir de uma VPS?">
    Sim — nodes são a forma de primeira classe para alcançar seu laptop a partir de um Gateway remoto, e eles
    liberam mais do que acesso shell. O Gateway roda em macOS/Linux (Windows via WSL2) e é
    leve (uma VPS pequena ou máquina classe Raspberry Pi já serve; 4 GB de RAM é bastante), então uma
    configuração comum é um host sempre ativo mais seu laptop como node.

    - **Sem SSH de entrada.** Nodes se conectam para fora ao Gateway WebSocket e usam pareamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é controlado por allowlists/aprovações do node nesse laptop.
    - **Mais ferramentas de dispositivo.** Nodes expõem `canvas`, `camera` e `screen` além de `system.run`.
    - **Automação de navegador local.** Mantenha o Gateway em uma VPS, mas execute o Chrome localmente por um node host no laptop, ou conecte-se ao Chrome local no host via Chrome MCP.

    SSH é bom para acesso shell ad hoc, mas nodes são mais simples para workflows contínuos de agentes e
    automação de dispositivos.

    Docs: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes), [Browser](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Nodes executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você esteja executando perfis isolados intencionalmente (consulte [Multiple gateways](/pt-BR/gateway/multiple-gateways)). Nodes são periféricos que se conectam
    ao gateway (nodes iOS/Android ou "modo node" no app da barra de menus no macOS). Para hosts de node headless
    e controle por CLI, consulte [Node host CLI](/cli/node).

    Uma reinicialização completa é necessária para alterações em `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Existe uma forma por API / RPC de aplicar config?">
    Sim.

    - `config.schema.lookup`: inspeciona uma subárvore de config com seu nó superficial de esquema, dica de UI correspondente e resumos dos filhos imediatos antes de gravar
    - `config.get`: busca o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições RPC); faz hot-reload quando possível e reinicia quando necessário
    - `config.apply`: valida + substitui a config inteira; faz hot-reload quando possível e reinicia quando necessário
    - A ferramenta de runtime `gateway` somente para owner ainda se recusa a reescrever `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` normalizam para os mesmos caminhos protegidos de exec

  </Accordion>

  <Accordion title="Config mínima sensata para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro Tailscale em uma VPS e conecto a partir do meu Mac?">
    Passos mínimos:

    1. **Instalar + fazer login na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + fazer login no seu Mac**
       - Use o app Tailscale e entre na mesma tailnet.
    3. **Habilitar MagicDNS (recomendado)**
       - No console admin do Tailscale, habilite MagicDNS para que a VPS tenha um nome estável.
    4. **Use o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a Control UI sem SSH, use Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um node Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **Control UI + WS do Gateway**. Nodes se conectam pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Certifique-se de que a VPS + Mac estejam na mesma tailnet**.
    2. **Use o app macOS em modo Remote** (o alvo SSH pode ser o hostname da tailnet).
       O app fará túnel da porta do Gateway e se conectará como node.
    3. **Aprove o node** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway protocol](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [macOS remote mode](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo laptop ou apenas adicionar um node?">
    Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como
    **node**. Isso mantém um único Gateway e evita config duplicada. As ferramentas de node locais
    atualmente são exclusivas do macOS, mas planejamos estendê-las a outros SOs.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou de dois bots totalmente separados.

    Docs: [Nodes](/pt-BR/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e adicionalmente carrega:

    - `.env` do diretório de trabalho atual
    - um `.env` global de fallback de `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum arquivo `.env` sobrescreve variáveis de ambiente existentes.

    Você também pode definir variáveis inline na config (aplicadas apenas se estiverem ausentes do ambiente do processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/pt-BR/help/environment) para precedência e fontes completas.

  </Accordion>

  <Accordion title="Iniciei o Gateway via serviço e minhas variáveis de ambiente sumiram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam carregadas mesmo quando o serviço não herda o ambiente do seu shell.
    2. Habilite importação do shell (conveniência opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Isso executa seu shell de login e importa apenas chaves esperadas ausentes (nunca sobrescreve). Equivalentes em env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas models status mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação do ambiente do shell** está habilitada. "Shell env: off"
    **não** significa que suas variáveis de ambiente estão ausentes — apenas significa que o OpenClaw não carregará
    automaticamente seu shell de login.

    Se o Gateway roda como serviço (launchd/systemd), ele não herdará seu
    ambiente do shell. Corrija de uma destas formas:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou habilite importação do shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da sua config (aplica apenas se estiver ausente).

    Depois reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e múltiplos chats

<AccordionGroup>
  <Accordion title="Como inicio uma conversa nova?">
    Envie `/new` ou `/reset` como mensagem independente. Consulte [Session management](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são resetadas automaticamente se eu nunca enviar /new?">
    Sessões podem expirar após `session.idleMinutes`, mas isso está **desativado por padrão** (valor padrão **0**).
    Defina um valor positivo para habilitar expiração por inatividade. Quando habilitado, a **próxima**
    mensagem após o período ocioso inicia um novo id de sessão para essa chave de chat.
    Isso não apaga transcrições — apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma forma de criar uma equipe de instâncias OpenClaw (um CEO e muitos agentes)?">
    Sim, via **roteamento multiagente** e **subagentes**. Você pode criar um agente coordenador
    e vários agentes workers com seus próprios workspaces e modelos.

    Dito isso, é melhor ver isso como um **experimento divertido**. Consome muitos tokens e muitas vezes é
    menos eficiente do que usar um bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com sessões diferentes para trabalho paralelo. Esse
    bot também pode gerar subagentes quando necessário.

    Docs: [Multi-agent routing](/pt-BR/concepts/multi-agent), [Sub-agents](/pt-BR/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramentas ou muitos
    arquivos podem acionar compactação ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao mudar de assunto.
    - Mantenha contexto importante no workspace e peça ao bot para relê-lo.
    - Use subagentes para trabalho longo ou paralelo para que o chat principal fique menor.
    - Escolha um modelo com janela de contexto maior se isso acontecer com frequência.

  </Accordion>

  <Accordion title="Como faço um reset completo do OpenClaw, mas mantendo-o instalado?">
    Use o comando de reset:

    ```bash
    openclaw reset
    ```

    Reset completo não interativo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois execute novamente a configuração:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Reset** se detectar uma config existente. Consulte [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), resete cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (somente dev; apaga config dev + credenciais + sessões + workspace).

  </Accordion>

  <Accordion title='Estou recebendo erros de "context too large" - como faço reset ou compactação?'>
    Use um destes:

    - **Compactar** (mantém a conversa, mas resume turnos antigos):

      ```
      /compact
      ```

      ou `/compact <instructions>` para orientar o resumo.

    - **Resetar** (novo id de sessão para a mesma chave de chat):

      ```
      /new
      /reset
      ```

    Se continuar acontecendo:

    - Habilite ou ajuste **session pruning** (`agents.defaults.contextPruning`) para cortar saída antiga de ferramentas.
    - Use um modelo com janela de contexto maior.

    Docs: [Compaction](/pt-BR/concepts/compaction), [Session pruning](/pt-BR/concepts/session-pruning), [Session management](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Isso é um erro de validação do provider: o modelo emitiu um bloco `tool_use` sem o
    `input` exigido. Normalmente significa que o histórico da sessão está obsoleto ou corrompido (muitas vezes após threads longas
    ou uma mudança de ferramenta/esquema).

    Correção: inicie uma nova sessão com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de heartbeat a cada 30 minutos?">
    Heartbeats executam a cada **30m** por padrão (**1h** ao usar autenticação OAuth). Ajuste ou desative:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" para desativar
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (somente linhas em branco e cabeçalhos
    markdown como `# Heading`), o OpenClaw ignora a execução do heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o heartbeat ainda roda e o modelo decide o que fazer.

    Sobrescritas por agente usam `agents.list[].heartbeat`. Docs: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta**, então se você está no grupo, o OpenClaw pode vê-lo.
    Por padrão, respostas em grupo ficam bloqueadas até que você permita remetentes (`groupPolicy: "allowlist"`).

    Se você quiser que apenas **você** possa acionar respostas em grupo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Como obtenho o JID de um grupo do WhatsApp?">
    Opção 1 (mais rápida): acompanhe logs e envie uma mensagem de teste no grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Procure `chatId` (ou `from`) terminando em `@g.us`, por exemplo:
    `1234567890-1234567890@g.us`.

    Opção 2 (se já estiver configurado/em allowlist): liste grupos da config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/pt-BR/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - O controle por menção está ligado (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Groups](/pt-BR/channels/groups) e [Group messages](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Chats diretos entram em colapso para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Groups](/pt-BR/channels/groups) e [Group messages](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agentes posso criar?">
    Sem limites rígidos. Dezenas (até centenas) funcionam bem, mas observe:

    - **Crescimento de disco:** sessões + transcrições vivem em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agentes significam mais uso simultâneo de modelo.
    - **Sobrecarga operacional:** perfis de autenticação, workspaces e roteamento de canal por agente.

    Dicas:

    - Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
    - Pode sessões antigas (apague JSONL ou entradas do armazenamento) se o disco crescer.
    - Use `openclaw doctor` para detectar workspaces soltos e incompatibilidades de perfil.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Multi-Agent Routing** para executar vários agentes isolados e rotear mensagens de entrada por
    canal/conta/peer. Slack é suportado como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não é "fazer qualquer coisa que um humano pode" — anti-bot, CAPTCHAs e MFA ainda podem
    bloquear a automação. Para o controle de navegador mais confiável, use Chrome MCP local no host,
    ou use CDP na máquina que realmente executa o navegador.

    Configuração de melhor prática:

    - Host Gateway sempre ativo (VPS/Mac mini).
    - Um agente por papel (bindings).
    - Canal(is) Slack vinculados a esses agentes.
    - Navegador local via Chrome MCP ou um node quando necessário.

    Docs: [Multi-Agent Routing](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Browser](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos: padrões, seleção, aliases, troca

<AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    O modelo padrão do OpenClaw é o que você definir como:

    ```
    agents.defaults.model.primary
    ```

    Modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.4`). Se você omitir o provider, o OpenClaw primeiro tenta um alias, depois uma correspondência única entre providers configurados para esse id exato de modelo e só então recua para o provider padrão configurado como caminho de compatibilidade obsoleto. Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw recua para o primeiro provider/modelo configurado em vez de mostrar um padrão obsoleto de provider removido. Mesmo assim, você deve **definir explicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    **Padrão recomendado:** use o modelo mais forte e de última geração disponível na sua stack de providers.
    **Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize força do modelo em vez de custo.
    **Para chat rotineiro/de baixo risco:** use modelos de fallback mais baratos e roteie por papel do agente.

    MiniMax tem sua própria documentação: [MiniMax](/pt-BR/providers/minimax) e
    [Local models](/pt-BR/gateway/local-models).

    Regra geral: use o **melhor modelo que puder pagar** para trabalhos de alto risco e um modelo
    mais barato para chat rotineiro ou resumos. Você pode rotear modelos por agente e usar subagentes para
    paralelizar tarefas longas (cada subagente consome tokens). Consulte [Models](/pt-BR/concepts/models) e
    [Sub-agents](/pt-BR/tools/subagents).

    Aviso importante: modelos mais fracos/quantizados em excesso são mais vulneráveis a injeção de prompt
    e comportamento inseguro. Consulte [Security](/pt-BR/gateway/security).

    Mais contexto: [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Como troco de modelo sem apagar minha config?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituir a config inteira.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a config de modelo)
    - `openclaw configure --section model` (interativo)
    - editar `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que você queira substituir a config inteira.
    Para edições via RPC, inspecione primeiro com `config.schema.lookup` e prefira `config.patch`. O payload de lookup fornece o caminho normalizado, docs/restrições superficiais do esquema e resumos dos filhos imediatos.
    para atualizações parciais.
    Se você sobrescreveu a config, restaure do backup ou execute `openclaw doctor` novamente para reparar.

    Docs: [Models](/pt-BR/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos self-hosted (llama.cpp, vLLM, Ollama)?">
    Sim. Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale Ollama em `https://ollama.com/download`
    2. Faça pull de um modelo local, como `ollama pull gemma4`
    3. Se também quiser modelos em nuvem, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Selecione `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos locais do Ollama
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de pull local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Observação de segurança: modelos menores ou fortemente quantizados são mais vulneráveis à injeção de prompt.
    Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se ainda quiser modelos pequenos, habilite sandboxing e allowlists estritas de ferramentas.

    Docs: [Ollama](/pt-BR/providers/ollama), [Local models](/pt-BR/gateway/local-models),
    [Model providers](/pt-BR/concepts/model-providers), [Security](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="O que OpenClaw, Flawd e Krill usam como modelos?">
    - Essas implantações podem ser diferentes e podem mudar com o tempo; não há uma recomendação fixa de provider.
    - Verifique a configuração atual de runtime em cada gateway com `openclaw models status`.
    - Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo mais forte e de última geração disponível.
  </Accordion>

  <Accordion title="Como troco de modelo em tempo real (sem reiniciar)?">
    Use o comando `/model` como mensagem independente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Esses são os aliases integrados. Aliases personalizados podem ser adicionados via `agents.defaults.models`.

    Você pode listar os modelos disponíveis com `/model`, `/model list` ou `/model status`.

    `/model` (e `/model list`) mostra um seletor compacto e numerado. Selecione pelo número:

    ```
    /model 3
    ```

    Você também pode forçar um perfil de autenticação específico para o provider (por sessão):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Dica: `/model status` mostra qual agente está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida.
    Também mostra o endpoint configurado do provider (`baseUrl`) e o modo de API (`api`) quando disponíveis.

    **Como desafixo um perfil que defini com @profile?**

    Execute `/model` novamente **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se quiser voltar ao padrão, selecione-o em `/model` (ou envie `/model <provider/model padrão>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Posso usar GPT 5.2 para tarefas diárias e Codex 5.3 para programação?">
    Sim. Defina um como padrão e troque conforme necessário:

    - **Troca rápida (por sessão):** `/model gpt-5.4` para tarefas diárias, `/model openai-codex/gpt-5.4` para programação com Codex OAuth.
    - **Padrão + troca:** defina `agents.defaults.model.primary` como `openai/gpt-5.4` e depois troque para `openai-codex/gpt-5.4` ao programar (ou o contrário).
    - **Subagentes:** roteie tarefas de programação para subagentes com um modelo padrão diferente.

    Consulte [Models](/pt-BR/concepts/models) e [Slash commands](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para GPT 5.4?">
    Use um toggle por sessão ou um padrão na config:

    - **Por sessão:** envie `/fast on` enquanto a sessão estiver usando `openai/gpt-5.4` ou `openai-codex/gpt-5.4`.
    - **Padrão por modelo:** defina `agents.defaults.models["openai/gpt-5.4"].params.fastMode` como `true`.
    - **Codex OAuth também:** se você também usar `openai-codex/gpt-5.4`, defina a mesma flag lá.

    Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, o modo rápido mapeia para `service_tier = "priority"` em requisições nativas Responses suportadas. Sobrescritas de sessão `/fast` têm precedência sobre padrões de config.

    Consulte [Thinking and fast mode](/pt-BR/tools/thinking) e [OpenAI fast mode](/pt-BR/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois nenhuma resposta?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e quaisquer
    sobrescritas de sessão. Escolher um modelo que não esteja nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a allowlist ou escolha um modelo em `/model list`.

  </Accordion>

  <Accordion title='Por que estou vendo "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provider não está configurado** (nenhuma config de provider MiniMax ou perfil
    de autenticação foi encontrado), então o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma release atual do OpenClaw (ou execute do código-fonte `main`) e depois reinicie o gateway.
    2. Certifique-se de que MiniMax está configurado (wizard ou JSON), ou que a autenticação MiniMax
       existe em env/perfis de autenticação para que o provider correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou MiniMax
       OAuth armazenado para `minimax-portal`).
    3. Use o id exato do modelo (sensível a maiúsculas/minúsculas) para seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração
       com chave de API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha na lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Models](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar MiniMax como padrão e OpenAI para tarefas complexas?">
    Sim. Use **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
    Fallbacks servem para **erros**, não para "tarefas difíceis", então use `/model` ou um agente separado.

    **Opção A: trocar por sessão**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Depois:

    ```
    /model gpt
    ```

    **Opção B: agentes separados**

    - Agente A padrão: MiniMax
    - Agente B padrão: OpenAI
    - Roteie por agente ou use `/agent` para trocar

    Docs: [Models](/pt-BR/concepts/models), [Multi-Agent Routing](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos integrados?">
    Sim. O OpenClaw envia alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, seu valor vence.

  </Accordion>

  <Accordion title="Como defino/sobrescrevo atalhos de modelo (aliases)?">
    Aliases vêm de `agents.defaults.models.<modelId>.alias`. Exemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Então `/model sonnet` (ou `/<alias>` quando suportado) resolve para esse id de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros providers, como OpenRouter ou Z.AI?">
    OpenRouter (pagamento por token; muitos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se você referenciar um provider/modelo, mas a chave necessária do provider estiver ausente, receberá um erro de autenticação em runtime (ex.: `No API key found for provider "zai"`).

    **No API key found for provider após adicionar um novo agente**

    Isso normalmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e
    fica em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções de correção:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o wizard.
    - Ou copie `auth-profiles.json` do `agentDir` do agente principal para o `agentDir` do novo agente.

    **Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelo e "All models failed"

<AccordionGroup>
  <Accordion title="Como o failover funciona?">
    O failover acontece em dois estágios:

    1. **Rotação de perfil de autenticação** dentro do mesmo provider.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam a perfis com falha (backoff exponencial), então o OpenClaw pode continuar respondendo mesmo quando um provider está com rate limit ou falhando temporariamente.

    O bucket de rate limit inclui mais do que respostas `429` simples. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites
    periódicos de janela de uso (`weekly/monthly limit reached`) como dignos de failover
    por rate limit.

    Algumas respostas que parecem faturamento não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provider retornar
    texto explícito de cobrança em `401` ou `403`, o OpenClaw ainda pode manter isso
    na faixa de faturamento, mas correspondências de texto específicas do provider permanecem limitadas ao
    provider que as possui (por exemplo `Key limit exceeded` do OpenRouter). Se uma mensagem `402`
    em vez disso parecer uma janela de uso tentável novamente ou
    limite de gasto de organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw trata isso como
    `rate_limit`, não como uma desativação longa por cobrança.

    Erros de estouro de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de compactação/retry em vez de avançar o fallback de modelo.

    O texto genérico de erro de servidor é intencionalmente mais estreito do que "qualquer coisa com
    unknown/error dentro". O OpenClaw trata formatos transitórios com escopo de provider
    como Anthropic puro `An unknown error occurred`, OpenRouter puro
    `Provider returned error`, erros de stop-reason como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provider ocupado como `ModelNotReadyException` como dignos de
    failover por timeout/sobrecarga quando o contexto do provider
    corresponde.
    Texto genérico de fallback interno como `LLM request failed with an unknown
    error.` permanece conservador e não aciona fallback de modelo sozinho.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Significa que o sistema tentou usar o id de perfil de autenticação `anthropic:default`, mas não encontrou credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde ficam os perfis de autenticação** (caminhos novos vs legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme que sua variável de ambiente foi carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no shell, mas executa o Gateway via systemd/launchd, ele talvez não a herde. Coloque-a em `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - **Certifique-se de estar editando o agente correto**
      - Configurações multiagente significam que pode haver vários arquivos `auth-profiles.json`.
    - **Verifique rapidamente status de modelo/autenticação**
      - Use `openclaw models status` para ver modelos configurados e se providers estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada a um perfil de autenticação Anthropic, mas o Gateway
    não consegue encontrá-lo em seu armazenamento de autenticação.

    - **Use Claude CLI**
      - Execute `openclaw models auth login --provider anthropic --method cli --set-default` no host do gateway.
    - **Se você quiser usar uma chave de API em vez disso**
      - Coloque `ANTHROPIC_API_KEY` em `~/.openclaw/.env` no **host do gateway**.
      - Limpe qualquer ordem fixada que force um perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirme que você está executando comandos no host do gateway**
      - Em modo remoto, perfis de autenticação ficam na máquina do gateway, não no seu laptop.

  </Accordion>

  <Accordion title="Por que ele também tentou Google Gemini e falhou?">
    Se sua config de modelo inclui Google Gemini como fallback (ou se você trocou para um atalho Gemini), o OpenClaw o tentará durante o fallback de modelo. Se você não tiver configurado credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação Google ou remova/evite modelos Google em `agents.defaults.model.fallbacks` / aliases para que o fallback não roteie para lá.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos de thinking sem assinaturas** (muitas vezes de
    um stream abortado/parcial). Google Antigravity exige assinaturas para blocos de thinking.

    Correção: o OpenClaw agora remove blocos de thinking sem assinatura para Claude do Google Antigravity. Se ainda aparecer, inicie uma **nova sessão** ou defina `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Related: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de token, padrões multi-conta)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um perfil de autenticação é um registro nomeado de credencial (OAuth ou chave de API) vinculado a um provider. Perfis vivem em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quais são ids típicos de perfil?">
    O OpenClaw usa ids com prefixo do provider como:

    - `anthropic:default` (comum quando não existe identidade de email)
    - `anthropic:<email>` para identidades OAuth
    - ids personalizados que você escolher (por exemplo `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A config oferece suporte a metadados opcionais para perfis e uma ordenação por provider (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia ids para provider/modo e define a ordem de rotação.

    O OpenClaw pode pular temporariamente um perfil se ele estiver em um **cooldown** curto (rate limits/timeouts/falhas de autenticação) ou em um estado **desativado** mais longo (cobrança/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns de rate limit podem ter escopo de modelo. Um perfil em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provider,
    enquanto janelas de cobrança/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir uma sobrescrita de ordem **por agente** (armazenada em `auth-state.json` desse agente) via CLI:

    ```bash
    # Usa por padrão o agente padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Travar a rotação em um único perfil (tentar apenas este)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou definir uma ordem explícita (fallback dentro do provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Limpar sobrescrita (voltar para auth.order da config / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para direcionar a um agente específico:

    ```bash