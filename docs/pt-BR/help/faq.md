---
read_when:
    - Respondendo a perguntas comuns sobre configuração, instalação, onboarding ou suporte de runtime
    - Triando problemas relatados por usuários antes de uma depuração mais profunda
summary: Perguntas frequentes sobre configuração, instalação e uso do OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-06T03:14:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d6d09621c6033d580cbcf1ff46f81587d69404d6f64c8d8fd8c3f09185bb920
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Respostas rápidas mais depuração mais aprofundada para configurações do mundo real (desenvolvimento local, VPS, multiagente, chaves OAuth/API, failover de modelo). Para diagnósticos de runtime, consulte [Solução de Problemas](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuração](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

1. **Status rápido (primeira verificação)**

   ```bash
   openclaw status
   ```

   Resumo local rápido: SO + atualização, alcance do gateway/serviço, agentes/sessões, configuração do provedor + problemas de runtime (quando o gateway estiver acessível).

2. **Relatório copiável (seguro para compartilhar)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico somente leitura com cauda de logs (tokens redigidos).

3. **Estado do daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra o runtime do supervisor vs. alcance do RPC, a URL de destino da sonda e qual configuração o serviço provavelmente usou.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Executa uma sonda ativa de integridade do gateway, incluindo sondas de canal quando compatíveis
   (requer um gateway acessível). Consulte [Saúde](/pt-BR/gateway/health).

5. **Acompanhe o log mais recente**

   ```bash
   openclaw logs --follow
   ```

   Se o RPC estiver indisponível, use como fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Os logs de arquivo são separados dos logs do serviço; consulte [Logging](/pt-BR/logging) e [Solução de Problemas](/pt-BR/gateway/troubleshooting).

6. **Execute o doctor (reparos)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuração/estado + executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).

7. **Snapshot do gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra a URL de destino + o caminho da configuração em caso de erro
   ```

   Solicita ao gateway em execução um snapshot completo (somente WS). Consulte [Saúde](/pt-BR/gateway/health).

## Início rápido e configuração da primeira execução

<AccordionGroup>
  <Accordion title="Estou travado, qual é a forma mais rápida de destravar">
    Use um agente de IA local que consiga **ver sua máquina**. Isso é muito mais eficaz do que perguntar
    no Discord, porque a maioria dos casos de "estou travado" são **problemas locais de configuração ou ambiente**
    que ajudantes remotos não conseguem inspecionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Essas ferramentas podem ler o repositório, executar comandos, inspecionar logs e ajudar a corrigir sua configuração
    em nível de máquina (PATH, serviços, permissões, arquivos de autenticação). Dê a elas o **checkout completo do código-fonte** por meio
    da instalação hackeável (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Isso instala o OpenClaw **a partir de um checkout git**, para que o agente possa ler o código + docs e
    raciocinar sobre a versão exata que você está executando. Você sempre pode voltar ao estável depois
    executando novamente o instalador sem `--install-method git`.

    Dica: peça ao agente para **planejar e supervisionar** a correção (passo a passo), então executar apenas os
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

    - `openclaw status`: snapshot rápido da saúde do gateway/agente + configuração básica.
    - `openclaw models status`: verifica autenticação do provedor + disponibilidade do modelo.
    - `openclaw doctor`: valida e repara problemas comuns de configuração/estado.

    Outras verificações úteis da CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rápido de depuração: [Primeiros 60 segundos se algo estiver quebrado](#primeiros-60-segundos-se-algo-estiver-quebrado).
    Docs de instalação: [Instalar](/pt-BR/install), [Flags do instalador](/pt-BR/install/installer), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O heartbeat continua sendo ignorado. O que significam os motivos de ignorar?">
    Motivos comuns para ignorar heartbeat:

    - `quiet-hours`: fora da janela configurada de horário ativo
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, mas contém apenas estrutura em branco/apenas cabeçalhos
    - `no-tasks-due`: o modo de tarefa de `HEARTBEAT.md` está ativo, mas nenhum dos intervalos de tarefa venceu ainda
    - `alerts-disabled`: toda a visibilidade de heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão todos desativados)

    No modo de tarefa, os timestamps de vencimento só são avançados após a conclusão
    de uma execução real de heartbeat. Execuções ignoradas não marcam tarefas como concluídas.

    Docs: [Heartbeat](/pt-BR/gateway/heartbeat), [Automação e Tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    O repositório recomenda executar a partir da fonte e usar onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    O assistente também pode compilar automaticamente os assets da UI. Após o onboarding, normalmente você executa o Gateway na porta **18789**.

    A partir da fonte (colaboradores/devs):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # instala dependências da UI automaticamente na primeira execução
    openclaw onboard
    ```

    Se você ainda não tiver uma instalação global, execute por `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Como abro o dashboard após o onboarding?">
    O assistente abre seu navegador com uma URL limpa do dashboard (sem token na URL) logo após o onboarding e também imprime o link no resumo. Mantenha essa aba aberta; se ela não tiver sido iniciada, copie/cole a URL impressa na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o dashboard em localhost vs remoto?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se pedir autenticação por segredo compartilhado, cole o token ou senha configurados nas configurações da Control UI.
    - Origem do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Origem da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se nenhum segredo compartilhado estiver configurado ainda, gere um token com `openclaw doctor --generate-gateway-token`.

    **Fora de localhost:**

    - **Tailscale Serve** (recomendado): mantenha o bind em loopback, execute `openclaw gateway --tailscale serve`, abra `https://<magicdns>/`. Se `gateway.auth.allowTailscale` for `true`, cabeçalhos de identidade satisfazem a autenticação da Control UI/WebSocket (sem colar segredo compartilhado, assumindo gateway host confiável); APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` de ingress privado ou autenticação HTTP de proxy confiável.
      Tentativas concorrentes ruins de autenticação Serve do mesmo cliente são serializadas antes que o limitador de falha de autenticação as registre, então a segunda tentativa ruim já pode mostrar `retry later`.
    - **Bind tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure autenticação por senha), abra `http://<tailscale-ip>:18789/`, depois cole o segredo compartilhado correspondente nas configurações do dashboard.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um proxy confiável não-loopback, configure `gateway.auth.mode: "trusted-proxy"` e então abra a URL do proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado ainda se aplica pelo túnel; cole o token ou senha configurados se solicitado.

    Consulte [Dashboard](/web/dashboard) e [Superfícies web](/web) para detalhes de modos de bind e autenticação.

  </Accordion>

  <Accordion title="Por que existem duas configurações de aprovação de exec para aprovações por chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec`: encaminha prompts de aprovação para destinos de chat
    - `channels.<channel>.execApprovals`: faz com que esse canal atue como um cliente nativo de aprovação para aprovações de exec

    A política de exec do host continua sendo o verdadeiro gate de aprovação. A configuração de chat controla apenas onde os
    prompts de aprovação aparecem e como as pessoas podem responder.

    Na maioria das configurações, você **não** precisa de ambos:

    - Se o chat já oferece suporte a comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Se um canal nativo compatível puder inferir aprovadores com segurança, o OpenClaw agora habilita automaticamente aprovações nativas DM-first quando `channels.<channel>.execApprovals.enabled` estiver indefinido ou `"auto"`.
    - Quando cartões/botões nativos de aprovação estiverem disponíveis, essa UI nativa será o caminho principal; o agente só deve incluir um comando manual `/approve` se o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou que a aprovação manual é o único caminho.
    - Use `approvals.exec` apenas quando os prompts também precisarem ser encaminhados para outros chats ou salas explícitas de operações.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` apenas quando quiser explicitamente que os prompts de aprovação sejam publicados de volta na sala/tópico de origem.
    - Aprovações de plugin são separadas novamente: elas usam `/approve` no mesmo chat por padrão, encaminhamento opcional `approvals.plugin`, e apenas alguns canais nativos mantêm tratamento nativo de aprovação de plugin por cima disso.

    Versão curta: encaminhamento é para roteamento, configuração de cliente nativo é para uma UX mais rica e específica do canal.
    Consulte [Aprovações de Exec](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="Que runtime eu preciso?">
    Node **>= 22** é obrigatório. `pnpm` é recomendado. Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Funciona em Raspberry Pi?">
    Sim. O Gateway é leve - os docs listam **512MB-1GB de RAM**, **1 núcleo** e cerca de **500MB**
    de disco como suficientes para uso pessoal, e observam que um **Raspberry Pi 4 pode executá-lo**.

    Se quiser folga extra (logs, mídia, outros serviços), **2GB é recomendado**, mas
    não é um mínimo rígido.

    Dica: um pequeno Pi/VPS pode hospedar o Gateway, e você pode parear **nodes** no seu laptop/celular para
    tela/câmera/canvas local ou execução de comandos. Consulte [Nodes](/pt-BR/nodes).

  </Accordion>

  <Accordion title="Alguma dica para instalações em Raspberry Pi?">
    Versão curta: funciona, mas espere algumas arestas.

    - Use um SO **64 bits** e mantenha Node >= 22.
    - Prefira a **instalação hackeável (git)** para poder ver logs e atualizar rápido.
    - Comece sem canais/Skills, depois adicione-os um a um.
    - Se encontrar problemas estranhos com binários, geralmente é um problema de **compatibilidade ARM**.

    Docs: [Linux](/pt-BR/platforms/linux), [Instalar](/pt-BR/install).

  </Accordion>

  <Accordion title="Fica preso em wake up my friend / o onboarding não conclui. E agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. O TUI também envia
    "Wake up, my friend!" automaticamente na primeira inicialização. Se você vir essa linha sem **nenhuma resposta**
    e os tokens continuarem em 0, o agente nunca foi executado.

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

    Se o Gateway for remoto, verifique se a conexão de túnel/Tailscale está ativa e se a UI
    está apontando para o Gateway correto. Consulte [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma nova máquina (Mac mini) sem refazer o onboarding?">
    Sim. Copie o **diretório de estado** e o **workspace**, depois execute o Doctor uma vez. Isso
    mantém seu bot "exatamente igual" (memória, histórico de sessão, autenticação e estado de canal),
    desde que você copie **ambos** os locais:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva configuração, perfis de autenticação, credenciais do WhatsApp, sessões e memória. Se você estiver em
    modo remoto, lembre-se de que o gateway host é o proprietário do armazenamento de sessões e do workspace.

    **Importante:** se você apenas commit/push do seu workspace para o GitHub, estará fazendo backup
    de **memória + arquivos bootstrap**, mas **não** do histórico de sessão nem da autenticação. Esses ficam
    em `~/.openclaw/` (por exemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migrando](/pt-BR/install/migrating), [Onde as coisas ficam no disco](#onde-as-coisas-ficam-no-disco),
    [Workspace do agente](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Modo remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde vejo o que há de novo na versão mais recente?">
    Consulte o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais recentes ficam no topo. Se a seção superior estiver marcada como **Unreleased**, a próxima seção
    datada é a versão mais recente enviada. As entradas são agrupadas por **Highlights**, **Changes** e
    **Fixes** (além de docs/outras seções quando necessário).

  </Accordion>

  <Accordion title="Não consigo acessar docs.openclaw.ai (erro SSL)">
    Algumas conexões Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` por meio do Xfinity
    Advanced Security. Desative-o ou coloque `docs.openclaw.ai` na allowlist e tente novamente.
    Ajude-nos a desbloqueá-lo reportando aqui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ainda não conseguir acessar o site, os docs estão espelhados no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre estável e beta">
    **Stable** e **beta** são **npm dist-tags**, não linhas de código separadas:

    - `latest` = estável
    - `beta` = build antecipada para testes

    Normalmente, uma versão estável chega primeiro em **beta**, depois uma etapa explícita
    de promoção move essa mesma versão para `latest`. Mantenedores também podem
    publicar direto em `latest` quando necessário. É por isso que beta e estável podem
    apontar para a **mesma versão** após a promoção.

    Veja o que mudou:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para one-liners de instalação e a diferença entre beta e dev, consulte o acordeão abaixo.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a npm dist-tag `beta` (pode corresponder a `latest` após a promoção).
    **Dev** é a cabeça móvel de `main` (git); quando publicada, usa a npm dist-tag `dev`.

    One-liners (macOS/Linux):

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

    1. **Canal dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Isso muda para a branch `main` e atualiza a partir da fonte.

    2. **Instalação hackeável (do site do instalador):**

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

    Docs: [Atualizar](/cli/update), [Canais de desenvolvimento](/pt-BR/install/development-channels),
    [Instalar](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo normalmente levam a instalação e o onboarding?">
    Guia aproximado:

    - **Instalação:** 2-5 minutos
    - **Onboarding:** 5-15 minutos, dependendo de quantos canais/modelos você configurar

    Se travar, use [Instalador travado](#inicio-rapido-e-configuracao-da-primeira-execucao)
    e o loop rápido de depuração em [Estou travado](#inicio-rapido-e-configuracao-da-primeira-execucao).

  </Accordion>

  <Accordion title="Instalador travado? Como obtenho mais feedback?">
    Execute novamente o instalador com **saída detalhada**:

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

    Mais opções: [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows diz git not found ou openclaw not recognized">
    Dois problemas comuns no Windows:

    **1) erro do npm spawn git / git not found**

    - Instale **Git for Windows** e garanta que `git` esteja no seu PATH.
    - Feche e reabra o PowerShell, então execute novamente o instalador.

    **2) openclaw is not recognized após a instalação**

    - Sua pasta bin global do npm não está no PATH.
    - Verifique o caminho:

      ```powershell
      npm config get prefix
      ```

    - Adicione esse diretório ao PATH do seu usuário (não é necessário o sufixo `\bin` no Windows; na maioria dos sistemas ele é `%AppData%\npm`).
    - Feche e reabra o PowerShell após atualizar o PATH.

    Se você quiser a configuração mais tranquila no Windows, use **WSL2** em vez de Windows nativo.
    Docs: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto em chinês corrompido - o que devo fazer?">
    Isso geralmente é uma incompatibilidade de code page do console em shells nativos do Windows.

    Sintomas:

    - a saída de `system.run`/`exec` renderiza chinês como texto corrompido
    - o mesmo comando parece correto em outro perfil de terminal

    Solução alternativa rápida no PowerShell:

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

  <Accordion title="Os docs não responderam à minha pergunta - como consigo uma resposta melhor?">
    Use a **instalação hackeável (git)** para ter a fonte completa e os docs localmente, depois pergunte
    ao seu bot (ou Claude/Codex) _a partir dessa pasta_ para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Instalar](/pt-BR/install) e [Flags do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    Resposta curta: siga o guia do Linux e depois execute o onboarding.

    - Caminho rápido para Linux + instalação do serviço: [Linux](/pt-BR/platforms/linux).
    - Passo a passo completo: [Primeiros Passos](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Instalar e atualizar](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e depois use SSH/Tailscale para alcançar o Gateway.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Mantemos um **hub de hospedagem** com os provedores comuns. Escolha um e siga o guia:

    - [Hospedagem VPS](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Como funciona na nuvem: o **Gateway é executado no servidor**, e você o acessa
    do seu laptop/celular pela Control UI (ou Tailscale/SSH). Seu estado + workspace
    ficam no servidor, então trate o host como a fonte da verdade e faça backup dele.

    Você pode parear **nodes** (Mac/iOS/Android/headless) com esse Gateway na nuvem para acessar
    tela/câmera/canvas locais ou executar comandos no seu laptop, mantendo o
    Gateway na nuvem.

    Hub: [Plataformas](/pt-BR/platforms). Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw para se atualizar sozinho?">
    Resposta curta: **é possível, mas não é recomendado**. O fluxo de atualização pode reiniciar o
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

    Docs: [Atualizar](/cli/update), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que o onboarding realmente faz?">
    `openclaw onboard` é o caminho de configuração recomendado. No **modo local**, ele orienta você por:

    - **Configuração de modelo/autenticação** (OAuth de provedor, chaves de API, setup-token legado da Anthropic, além de opções de modelo local como LM Studio)
    - Localização do **workspace** + arquivos bootstrap
    - **Configurações do Gateway** (bind/porta/autenticação/tailscale)
    - **Canais** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, além de plugins de canal empacotados como QQ Bot)
    - **Instalação do daemon** (LaunchAgent no macOS; unidade de usuário systemd no Linux/WSL2)
    - **Verificações de integridade** e seleção de **Skills**

    Ele também alerta se o modelo configurado for desconhecido ou se faltar autenticação.

  </Accordion>

  <Accordion title="Preciso de uma assinatura Claude ou OpenAI para executar isso?">
    Não. Você pode executar o OpenClaw com **chaves de API** (Anthropic/OpenAI/outras) ou com
    **modelos somente locais**, para que seus dados permaneçam no seu dispositivo. Assinaturas (Claude
    Pro/Max ou OpenAI Codex) são formas opcionais de autenticar esses provedores.

    Para Anthropic no OpenClaw, a divisão prática é:

    - **Chave de API da Anthropic**: cobrança normal da API da Anthropic
    - **Autenticação por assinatura Claude no OpenClaw**: a Anthropic informou aos usuários do OpenClaw em
      **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que isso requer
      **Extra Usage**, cobrado separadamente da assinatura

    Nossas reproduções locais também mostram que `claude -p --append-system-prompt ...` pode
    encontrar a mesma barreira de Extra Usage quando o prompt anexado identifica
    OpenClaw, enquanto a mesma string de prompt **não** reproduz esse bloqueio no
    caminho Anthropic SDK + chave de API. O OAuth do OpenAI Codex é explicitamente
    compatível com ferramentas externas como o OpenClaw.

    O OpenClaw também oferece suporte a outras opções hospedadas em estilo assinatura, incluindo
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [Modelos GLM](/pt-BR/providers/glm),
    [Modelos locais](/pt-BR/gateway/local-models), [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar a assinatura Claude Max sem uma chave de API?">
    Sim, mas trate isso como **autenticação por assinatura Claude com Extra Usage**.

    As assinaturas Claude Pro/Max não incluem uma chave de API. No OpenClaw, isso
    significa que o aviso específico de cobrança da Anthropic para OpenClaw se aplica: o tráfego
    por assinatura requer **Extra Usage**. Se você quiser tráfego Anthropic sem
    esse caminho de Extra Usage, use uma chave de API da Anthropic.

  </Accordion>

  <Accordion title="Vocês oferecem suporte a autenticação por assinatura Claude (Claude Pro ou Max)?">
    Sim, mas a interpretação suportada agora é:

    - Anthropic no OpenClaw com uma assinatura significa **Extra Usage**
    - Anthropic no OpenClaw sem esse caminho significa **chave de API**

    O setup-token da Anthropic ainda está disponível como um caminho legado/manual no OpenClaw,
    e o aviso específico de cobrança da Anthropic para OpenClaw ainda se aplica ali. Nós
    também reproduzimos localmente a mesma barreira de cobrança com uso direto de
    `claude -p --append-system-prompt ...` quando o prompt anexado
    identifica OpenClaw, enquanto a mesma string de prompt **não** reproduziu isso no
    caminho Anthropic SDK + chave de API.

    Para cargas de trabalho de produção ou multiusuário, a autenticação por chave de API da Anthropic é a
    escolha mais segura e recomendada. Se você quiser outras opções hospedadas em estilo
    assinatura no OpenClaw, consulte [OpenAI](/pt-BR/providers/openai), [Qwen / Model
    Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e
    [Modelos GLM](/pt-BR/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
Isso significa que sua **cota/limite de taxa da Anthropic** foi esgotada para a janela atual. Se você
usa **Claude CLI**, espere a janela ser redefinida ou atualize seu plano. Se você
usa uma **chave de API da Anthropic**, verifique o Console da Anthropic
quanto a uso/cobrança e aumente os limites se necessário.

    Se a mensagem for especificamente:
    `Extra usage is required for long context requests`, a solicitação está tentando usar
    a versão beta de contexto de 1M da Anthropic (`context1m: true`). Isso só funciona quando sua
    credencial é elegível para cobrança de contexto longo (cobrança por chave de API ou o
    caminho de login Claude do OpenClaw com Extra Usage habilitado).

    Dica: defina um **modelo de fallback** para que o OpenClaw possa continuar respondendo enquanto um provedor estiver com limite de taxa.
    Consulte [Models](/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock é compatível?">
    Sim. O OpenClaw tem um provedor empacotado **Amazon Bedrock (Converse)**. Com marcadores de ambiente AWS presentes, o OpenClaw pode descobrir automaticamente o catálogo Bedrock de streaming/texto e mesclá-lo como um provedor implícito `amazon-bedrock`; caso contrário, você pode habilitar explicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` ou adicionar uma entrada manual de provedor. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Provedores de modelo](/pt-BR/providers/models). Se preferir um fluxo gerenciado por chave, um proxy compatível com OpenAI na frente do Bedrock ainda é uma opção válida.
  </Accordion>

  <Accordion title="Como funciona a autenticação do Codex?">
    O OpenClaw oferece suporte a **OpenAI Code (Codex)** por OAuth (login do ChatGPT). O onboarding pode executar o fluxo OAuth e definirá o modelo padrão como `openai-codex/gpt-5.4` quando apropriado. Consulte [Provedores de modelo](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Vocês oferecem suporte a autenticação por assinatura OpenAI (Codex OAuth)?">
    Sim. O OpenClaw oferece suporte completo a **OAuth de assinatura do OpenAI Code (Codex)**.
    A OpenAI permite explicitamente o uso de OAuth por assinatura em ferramentas/fluxos de trabalho externos
    como OpenClaw. O onboarding pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Provedores de modelo](/pt-BR/concepts/model-providers) e [Onboarding (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth do Gemini CLI?">
    Gemini CLI usa um **fluxo de autenticação de plugin**, não um client id ou secret em `openclaw.json`.

    Use o provedor Gemini API em vez disso:

    1. Habilite o plugin: `openclaw plugins enable google`
    2. Execute `openclaw onboard --auth-choice gemini-api-key`
    3. Defina um modelo Google como `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Um modelo local é adequado para chats casuais?">
    Geralmente não. O OpenClaw precisa de contexto grande + forte segurança; placas pequenas truncam e vazam. Se precisar, execute localmente a **maior** build de modelo que conseguir (LM Studio) e consulte [/gateway/local-models](/pt-BR/gateway/local-models). Modelos menores/quantizados aumentam o risco de injeção de prompt - consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelo hospedado em uma região específica?">
    Escolha endpoints fixados por região. O OpenRouter expõe opções hospedadas nos EUA para MiniMax, Kimi e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar Anthropic/OpenAI junto com esses usando `models.mode: "merge"`, para que fallbacks permaneçam disponíveis respeitando o provedor regional que você selecionar.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isso?">
    Não. O OpenClaw funciona em macOS ou Linux (Windows via WSL2). Um Mac mini é opcional - algumas pessoas
    compram um como host sempre ligado, mas uma pequena VPS, servidor doméstico ou máquina classe Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) (recomendado) - o servidor BlueBubbles roda em qualquer Mac, e o Gateway pode rodar no Linux ou em outro lugar. Se quiser outras ferramentas exclusivas do macOS, execute o Gateway em um Mac ou pareie um node macOS.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes), [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para suporte ao iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages. **Não** precisa ser um Mac mini -
    qualquer Mac serve. **Use [BlueBubbles](/pt-BR/channels/bluebubbles)** (recomendado) para iMessage - o servidor BlueBubbles roda no macOS, enquanto o Gateway pode rodar no Linux ou em outro lugar.

    Configurações comuns:

    - Execute o Gateway em Linux/VPS e execute o servidor BlueBubbles em qualquer Mac conectado ao Messages.
    - Execute tudo no Mac, se quiser a configuração mais simples em uma única máquina.

    Docs: [BlueBubbles](/pt-BR/channels/bluebubbles), [Nodes](/pt-BR/nodes),
    [Modo remoto no Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro pode se conectar como um
    **node** (dispositivo complementar). Nodes não executam o Gateway - eles fornecem capacidades extras
    como tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum:

    - Gateway no Mac mini (sempre ligado).
    - O MacBook Pro executa o app macOS ou um host de node e pareia com o Gateway.
    - Use `openclaw nodes status` / `openclaw nodes list` para vê-lo.

    Docs: [Nodes](/pt-BR/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Bun **não é recomendado**. Vemos bugs de runtime, especialmente com WhatsApp e Telegram.
    Use **Node** para gateways estáveis.

    Se ainda quiser experimentar com Bun, faça isso em um gateway de não produção
    sem WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: o que entra em allowFrom?">
    `channels.telegram.allowFrom` é **o ID de usuário do Telegram do remetente humano** (numérico). Não é o nome de usuário do bot.

    O onboarding aceita entrada `@username` e a resolve para um ID numérico, mas a autorização do OpenClaw usa apenas IDs numéricos.

    Mais seguro (sem bot de terceiros):

    - Envie uma DM ao seu bot e depois execute `openclaw logs --follow` e leia `from.id`.

    Bot API oficial:

    - Envie uma DM ao seu bot e depois chame `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado):

    - Envie DM para `@userinfobot` ou `@getidsbot`.

    Consulte [/channels/telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número de WhatsApp com diferentes instâncias do OpenClaw?">
    Sim, via **roteamento multiagente**. Vincule a **DM** do WhatsApp de cada remetente (peer `kind: "direct"`, remetente E.164 como `+15551234567`) a um `agentId` diferente, para que cada pessoa tenha seu próprio workspace e armazenamento de sessão. As respostas ainda vêm da **mesma conta de WhatsApp**, e o controle de acesso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta de WhatsApp. Consulte [Roteamento Multiagente](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agente de "chat rápido" e um agente "Opus para programação"?'>
    Sim. Use roteamento multiagente: dê a cada agente seu próprio modelo padrão e depois vincule rotas de entrada (conta do provedor ou peers específicos) a cada agente. Um exemplo de configuração está em [Roteamento Multiagente](/pt-BR/concepts/multi-agent). Consulte também [Models](/pt-BR/concepts/models) e [Configuração](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim. O Homebrew oferece suporte ao Linux (Linuxbrew). Configuração rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se você executar o OpenClaw via systemd, garanta que o PATH do serviço inclua `/home/linuxbrew/.linuxbrew/bin` (ou seu prefixo do brew) para que ferramentas instaladas pelo `brew` sejam resolvidas em shells sem login.
    Builds recentes também adicionam diretórios bin comuns de usuário em serviços Linux systemd (por exemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação git hackeável e npm install">
    - **Instalação hackeável (git):** checkout completo da fonte, editável, melhor para contribuidores.
      Você executa builds localmente e pode corrigir código/docs.
    - **npm install:** instalação global da CLI, sem repositório, melhor para "apenas executar".
      As atualizações vêm das npm dist-tags.

    Docs: [Primeiros passos](/pt-BR/start/getting-started), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar entre instalações npm e git depois?">
    Sim. Instale a outra variante e então execute o Doctor para que o serviço do gateway aponte para o novo entrypoint.
    Isso **não apaga seus dados** - apenas muda a instalação de código do OpenClaw. Seu estado
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

    O Doctor detecta um desalinhamento de entrypoint do serviço do gateway e oferece reescrever a configuração do serviço para corresponder à instalação atual (use `--repair` em automação).

    Dicas de backup: consulte [Estratégia de backup](#onde-as-coisas-ficam-no-disco).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em uma VPS?">
    Resposta curta: **se você quer confiabilidade 24/7, use uma VPS**. Se quiser o
    menor atrito e estiver tudo bem com suspensão/reinicializações, execute localmente.

    **Laptop (Gateway local)**

    - **Prós:** sem custo de servidor, acesso direto a arquivos locais, janela do navegador visível.
    - **Contras:** suspensão/quedas de rede = desconexões, atualizações/reinicializações do SO interrompem, precisa ficar acordado.

    **VPS / nuvem**

    - **Prós:** sempre ligado, rede estável, sem problemas de suspensão do laptop, mais fácil de manter em execução.
    - **Contras:** geralmente roda headless (use screenshots), acesso a arquivos apenas remoto, você precisa usar SSH para atualizar.

    **Observação específica do OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem a partir de uma VPS. A única troca real é **navegador headless** vs janela visível. Consulte [Navegador](/pt-BR/tools/browser).

    **Padrão recomendado:** VPS se você já teve desconexões de gateway antes. Local é ótimo quando você está usando ativamente o Mac e quer acesso a arquivos locais ou automação de UI com um navegador visível.

  </Accordion>

  <Accordion title="Quão importante é executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas **é recomendado para confiabilidade e isolamento**.

    - **Host dedicado (VPS/Mac mini/Pi):** sempre ligado, menos interrupções por suspensão/reinicialização, permissões mais limpas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** totalmente adequado para testes e uso ativo, mas espere pausas quando a máquina suspender ou atualizar.

    Se você quer o melhor dos dois mundos, mantenha o Gateway em um host dedicado e pareie seu laptop como um **node** para ferramentas locais de tela/câmera/exec. Consulte [Nodes](/pt-BR/nodes).
    Para orientações de segurança, leia [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o SO recomendado?">
    O OpenClaw é leve. Para um Gateway básico + um canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM ou mais para folga (logs, mídia, múltiplos canais). Ferramentas de node e automação de navegador podem consumir muitos recursos.

    SO: use **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno). O caminho de instalação no Linux é melhor testado lá.

    Docs: [Linux](/pt-BR/platforms/linux), [Hospedagem VPS](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM da mesma forma que uma VPS: ela precisa estar sempre ligada, acessível e ter RAM suficiente
    para o Gateway e quaisquer canais que você habilitar.

    Orientação de base:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM ou mais se você executar múltiplos canais, automação de navegador ou ferramentas de mídia.
    - **SO:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    Se você estiver no Windows, **WSL2 é a configuração estilo VM mais fácil** e tem a melhor
    compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [Hospedagem VPS](/pt-BR/vps).
    Se estiver executando macOS em uma VM, consulte [VM macOS](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## O que é OpenClaw?

<AccordionGroup>
  <Accordion title="O que é OpenClaw, em um parágrafo?">
    OpenClaw é um assistente pessoal de IA que você executa em seus próprios dispositivos. Ele responde nas superfícies de mensagens que você já usa (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugins de canal empacotados, como QQ Bot) e também pode fazer voz + um Canvas ao vivo em plataformas compatíveis. O **Gateway** é o plano de controle sempre ligado; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    OpenClaw não é "apenas um wrapper do Claude". É um **plano de controle local-first** que permite executar um
    assistente capaz em **seu próprio hardware**, acessível a partir dos apps de chat que você já usa, com
    sessões com estado, memória e ferramentas - sem entregar o controle dos seus fluxos de trabalho a um
    SaaS hospedado.

    Destaques:

    - **Seus dispositivos, seus dados:** execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o
      workspace + histórico de sessões locais.
    - **Canais reais, não um sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      além de voz móvel e Canvas em plataformas compatíveis.
    - **Agnóstico a modelos:** use Anthropic, OpenAI, MiniMax, OpenRouter etc., com roteamento
      por agente e failover.
    - **Opção somente local:** execute modelos locais para que **todos os dados possam permanecer no seu dispositivo** se quiser.
    - **Roteamento multiagente:** agentes separados por canal, conta ou tarefa, cada um com seu próprio
      workspace e padrões.
    - **Open source e hackeável:** inspecione, estenda e faça self-host sem vendor lock-in.

    Docs: [Gateway](/pt-BR/gateway), [Canais](/pt-BR/channels), [Multiagente](/pt-BR/concepts/multi-agent),
    [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurar - o que devo fazer primeiro?">
    Bons primeiros projetos:

    - Criar um website (WordPress, Shopify ou um site estático simples).
    - Prototipar um app móvel (estrutura, telas, plano de API).
    - Organizar arquivos e pastas (limpeza, nomenclatura, tags).
    - Conectar Gmail e automatizar resumos ou acompanhamentos.

    Ele consegue lidar com tarefas grandes, mas funciona melhor quando você as divide em fases e
    usa subagentes para trabalho em paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidianos para o OpenClaw?">
    Ganhos do dia a dia geralmente se parecem com isto:

    - **Briefings pessoais:** resumos da caixa de entrada, calendário e notícias que importam para você.
    - **Pesquisa e redação:** pesquisa rápida, resumos e primeiros rascunhos para e-mails ou docs.
    - **Lembretes e acompanhamentos:** alertas e checklists guiados por cron ou heartbeat.
    - **Automação de navegador:** preenchimento de formulários, coleta de dados e repetição de tarefas web.
    - **Coordenação entre dispositivos:** envie uma tarefa do seu celular, deixe o Gateway executá-la em um servidor e receba o resultado de volta no chat.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com lead gen, outreach, anúncios e blogs para um SaaS?">
    Sim para **pesquisa, qualificação e redação**. Ele pode escanear sites, montar shortlists,
    resumir prospects e escrever rascunhos de outreach ou copy de anúncios.

    Para **outreach ou campanhas de anúncios**, mantenha um humano no fluxo. Evite spam, siga as leis locais e
    as políticas das plataformas, e revise tudo antes de enviar. O padrão mais seguro é deixar o
    OpenClaw redigir e você aprovar.

    Docs: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em relação ao Claude Code para desenvolvimento web?">
    OpenClaw é um **assistente pessoal** e camada de coordenação, não um substituto de IDE. Use
    Claude Code ou Codex para o loop de programação direta mais rápido dentro de um repositório. Use OpenClaw quando você
    quiser memória durável, acesso entre dispositivos e orquestração de ferramentas.

    Vantagens:

    - **Memória persistente + workspace** entre sessões
    - **Acesso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestração de ferramentas** (navegador, arquivos, agendamento, hooks)
    - **Gateway sempre ligado** (execute em uma VPS, interaja de qualquer lugar)
    - **Nodes** para navegador/tela/câmera/exec local

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem manter o repositório sujo?">
    Use overrides gerenciados em vez de editar a cópia do repositório. Coloque suas alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta via `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). A precedência é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → empacotado → `skills.load.extraDirs`, então overrides gerenciados ainda vencem Skills empacotadas sem tocar no git. Se você precisar da Skill instalada globalmente mas visível apenas para alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` e `agents.list[].skills`. Apenas alterações que valham upstream devem viver no repositório e sair como PRs.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim. Adicione diretórios extras por `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (menor precedência). A precedência padrão é `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → empacotado → `skills.load.extraDirs`. `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Se a Skill só deve ficar visível para certos agentes, combine isso com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos diferentes para tarefas diferentes?">
    Hoje, os padrões compatíveis são:

    - **Trabalhos cron**: trabalhos isolados podem definir um override `model` por trabalho.
    - **Subagentes**: roteie tarefas para agentes separados com diferentes modelos padrão.
    - **Troca sob demanda**: use `/model` para alternar o modelo da sessão atual a qualquer momento.

    Consulte [Trabalhos cron](/pt-BR/automation/cron-jobs), [Roteamento Multiagente](/pt-BR/concepts/multi-agent) e [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot congela enquanto faz trabalho pesado. Como faço offload disso?">
    Use **subagentes** para tarefas longas ou paralelas. Subagentes são executados em sua própria sessão,
    retornam um resumo e mantêm seu chat principal responsivo.

    Peça ao seu bot para "spawn um subagente para esta tarefa" ou use `/subagents`.
    Use `/status` no chat para ver o que o Gateway está fazendo agora (e se está ocupado).

    Dica de tokens: tarefas longas e subagentes ambos consomem tokens. Se custo for uma preocupação, defina um
    modelo mais barato para subagentes via `agents.defaults.subagents.model`.

    Docs: [Subagentes](/pt-BR/tools/subagents), [Tarefas em Segundo Plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam as sessões de subagente vinculadas a threads no Discord?">
    Use vinculações de thread. Você pode vincular uma thread do Discord a um subagente ou alvo de sessão para que mensagens de acompanhamento nessa thread permaneçam naquela sessão vinculada.

    Fluxo básico:

    - Faça spawn com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - Use `/agents` para inspecionar o estado da vinculação.
    - Use `/session idle <duration|off>` e `/session max-age <duration|off>` para controlar o desfoco automático.
    - Use `/unfocus` para desvincular a thread.

    Configuração necessária:

    - Padrões globais: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides do Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculação automática ao fazer spawn: defina `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Subagentes](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Referência de Configuração](/pt-BR/gateway/configuration-reference), [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi para o lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique primeiro a rota resolvida do solicitante:

    - A entrega de subagente em modo de conclusão prefere qualquer thread vinculada ou rota de conversa quando uma existir.
    - Se a origem da conclusão carregar apenas um canal, o OpenClaw recorre à rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa funcionar.
    - Se não existir nem rota vinculada nem rota armazenada utilizável, a entrega direta pode falhar e o resultado recorre à entrega enfileirada na sessão em vez de publicar imediatamente no chat.
    - Alvos inválidos ou obsoletos ainda podem forçar fallback para fila ou falha final de entrega.
    - Se a última resposta visível do assistente no filho for exatamente o token silencioso `NO_REPLY` / `no_reply`, ou exatamente `ANNOUNCE_SKIP`, o OpenClaw intencionalmente suprime o anúncio em vez de publicar progresso anterior obsoleto.
    - Se o filho expirar após apenas chamadas de ferramenta, o anúncio pode resumir isso em um pequeno resumo de progresso parcial em vez de reproduzir saída bruta de ferramenta.

    Depuração:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Subagentes](/pt-BR/tools/subagents), [Tarefas em Segundo Plano](/pt-BR/automation/tasks), [Ferramenta de Sessão](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não disparam. O que devo verificar?">
    O cron é executado dentro do processo do Gateway. Se o Gateway não estiver em execução contínua,
    os trabalhos agendados não serão executados.

    Checklist:

    - Confirme que cron está habilitado (`cron.enabled`) e que `OPENCLAW_SKIP_CRON` não está definido.
    - Verifique se o Gateway está rodando 24/7 (sem suspensão/reinicializações).
    - Verifique as configurações de fuso horário do trabalho (`--tz` vs fuso horário do host).

    Depuração:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Trabalhos cron](/pt-BR/automation/cron-jobs), [Automação e Tarefas](/pt-BR/automation).

  </Accordion>

  <Accordion title="O cron disparou, mas nada foi enviado ao canal. Por quê?">
    Verifique primeiro o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que nenhuma mensagem externa é esperada.
    - Alvo de anúncio ausente ou inválido (`channel` / `to`) significa que o runner ignorou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`) significam que o runner tentou entregar, mas as credenciais bloquearam.
    - Um resultado isolado silencioso (`NO_REPLY` / `no_reply` apenas) é tratado como intencionalmente não entregável, então o runner também suprime a entrega de fallback enfileirada.

    Para trabalhos cron isolados, o runner é o proprietário da entrega final. Espera-se
    que o agente retorne um resumo em texto simples para o runner enviar. `--no-deliver` mantém
    esse resultado interno; não permite que o agente envie diretamente com a
    ferramenta de mensagem.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabalhos cron](/pt-BR/automation/cron-jobs), [Tarefas em Segundo Plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução cron isolada trocou de modelo ou tentou novamente uma vez?">
    Isso geralmente é o caminho ativo de troca de modelo, não agendamento duplicado.

    O cron isolado pode persistir um handoff de modelo em runtime e tentar novamente quando a
    execução ativa lança `LiveSessionModelSwitchError`. A nova tentativa mantém o
    provedor/modelo trocado, e se a troca carregou um novo override de perfil de autenticação, o cron
    também persiste isso antes de tentar novamente.

    Regras relacionadas de seleção:

    - O override de modelo do hook do Gmail vence primeiro quando aplicável.
    - Depois, o `model` por trabalho.
    - Depois, qualquer override armazenado de modelo da sessão do cron.
    - Depois, a seleção normal de modelo padrão/do agente.

    O loop de nova tentativa é limitado. Após a tentativa inicial mais 2 novas tentativas de troca,
    o cron aborta em vez de entrar em loop infinito.

    Depuração:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabalhos cron](/pt-BR/automation/cron-jobs), [CLI de cron](/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use comandos nativos `openclaw skills` ou solte Skills no seu workspace. A UI de Skills do macOS não está disponível no Linux.
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

    - **Trabalhos cron** para tarefas agendadas ou recorrentes (persistem entre reinicializações).
    - **Heartbeat** para verificações periódicas de "sessão principal".
    - **Trabalhos isolados** para agentes autônomos que publicam resumos ou entregam em chats.

    Docs: [Trabalhos cron](/pt-BR/automation/cron-jobs), [Automação e Tarefas](/pt-BR/automation),
    [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do macOS Apple a partir do Linux?">
    Não diretamente. Skills do macOS são controladas por `metadata.openclaw.os` mais binários necessários, e as Skills só aparecem no prompt de sistema quando são elegíveis no **gateway host**. No Linux, Skills somente `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas, a menos que você faça override do gating.

    Você tem três padrões compatíveis:

    **Opção A - execute o Gateway em um Mac (mais simples).**
    Execute o Gateway onde os binários do macOS existem e conecte-se a partir do Linux em [modo remoto](#gateway-ports-already-running-and-remote-mode) ou por Tailscale. As Skills são carregadas normalmente porque o gateway host é macOS.

    **Opção B - use um node macOS (sem SSH).**
    Execute o Gateway no Linux, pareie um node macOS (app de barra de menu) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários necessários existirem no node. O agente executa essas Skills pela ferramenta `nodes`. Se você escolher "Always Ask", aprovar "Always Allow" no prompt adiciona esse comando à allowlist.

    **Opção C - faça proxy de binários do macOS por SSH (avançado).**
    Mantenha o Gateway no Linux, mas faça os binários CLI necessários serem resolvidos para wrappers SSH que são executados em um Mac. Em seguida, faça override da Skill para permitir Linux, de modo que ela permaneça elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloque o wrapper no `PATH` do host Linux (por exemplo `~/bin/memo`).
    3. Faça override dos metadados da Skill (workspace ou `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicie uma nova sessão para que o snapshot de Skills seja atualizado.

  </Accordion>

  <Accordion title="Vocês têm integração com Notion ou HeyGen?">
    Não nativamente no momento.

    Opções:

    - **Skill / plugin personalizado:** melhor para acesso confiável à API (Notion/HeyGen ambos têm APIs).
    - **Automação de navegador:** funciona sem código, mas é mais lenta e mais frágil.

    Se você quiser manter contexto por cliente (fluxos de agência), um padrão simples é:

    - Uma página do Notion por cliente (contexto + preferências + trabalho ativo).
    - Peça ao agente para buscar essa página no início de uma sessão.

    Se quiser uma integração nativa, abra uma solicitação de funcionalidade ou crie uma Skill
    direcionada a essas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalações nativas caem no diretório `skills/` do workspace ativo. Para Skills compartilhadas entre agentes, coloque-as em `~/.openclaw/skills/<name>/SKILL.md`. Se apenas alguns agentes devem ver uma instalação compartilhada, configure `agents.defaults.skills` ou `agents.list[].skills`. Algumas Skills esperam binários instalados via Homebrew; no Linux isso significa Linuxbrew (veja a entrada da FAQ do Homebrew Linux acima). Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config) e [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome já conectado com o OpenClaw?">
    Use o perfil de navegador integrado `user`, que se conecta por Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se quiser um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esse caminho é local ao host. Se o Gateway estiver em outro lugar, execute um host de node na máquina do navegador ou use CDP remoto.

    Limites atuais em `existing-session` / `user`:

    - ações são orientadas por ref, não por seletor CSS
    - uploads exigem `ref` / `inputRef` e atualmente oferecem suporte a um arquivo por vez
    - `responsebody`, exportação para PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe um doc dedicado para sandboxing?">
    Sim. Consulte [Sandboxing](/pt-BR/gateway/sandboxing). Para configuração específica de Docker (gateway completo em Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="O Docker parece limitado - como habilito recursos completos?">
    A imagem padrão prioriza segurança e roda como usuário `node`, então não
    inclui pacotes de sistema, Homebrew ou navegadores empacotados. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para que os caches sobrevivam.
    - Grave dependências de sistema na imagem com `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instale navegadores Playwright pela CLI empacotada:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e garanta que o caminho seja persistido.

    Docs: [Docker](/pt-BR/install/docker), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter DMs pessoais, mas tornar grupos públicos/em sandbox com um único agente?">
    Sim - se seu tráfego privado for **DMs** e seu tráfego público for **grupos**.

    Use `agents.defaults.sandbox.mode: "non-main"` para que sessões de grupo/canal (chaves non-main) sejam executadas no Docker, enquanto a sessão principal de DM permanece no host. Em seguida, restrinja quais ferramentas ficam disponíveis em sessões em sandbox por `tools.sandbox.tools`.

    Passo a passo de configuração + exemplo: [Grupos: DMs pessoais + grupos públicos](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referência principal de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Como faço bind de uma pasta do host no sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por exemplo `"/home/user/src:/src:ro"`). Binds globais + por agente são mesclados; binds por agente são ignorados quando `scope: "shared"`. Use `:ro` para qualquer coisa sensível e lembre-se de que binds contornam as paredes do sistema de arquivos do sandbox.

    O OpenClaw valida origens de bind tanto pelo caminho normalizado quanto pelo caminho canônico resolvido por meio do ancestral existente mais profundo. Isso significa que escapes por pai de symlink ainda falham de forma fechada, mesmo quando o último segmento do caminho ainda não existe, e as verificações de raiz permitida ainda se aplicam após a resolução de symlink.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para exemplos e observações de segurança.

  </Accordion>

  <Accordion title="Como a memória funciona?">
    A memória do OpenClaw são apenas arquivos Markdown no workspace do agente:

    - Notas diárias em `memory/YYYY-MM-DD.md`
    - Notas de longo prazo curadas em `MEMORY.md` (somente sessões principais/privadas)

    O OpenClaw também executa um **flush silencioso de memória antes da compactação** para lembrar o modelo
    de gravar notas duráveis antes da compactação automática. Isso só é executado quando o workspace
    é gravável (sandboxes somente leitura ignoram isso). Consulte [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo coisas. Como faço para fixá-las?">
    Peça ao bot para **gravar o fato na memória**. Notas de longo prazo pertencem a `MEMORY.md`,
    contexto de curto prazo vai em `memory/YYYY-MM-DD.md`.

    Essa ainda é uma área que estamos melhorando. Ajuda lembrar o modelo de armazenar memórias;
    ele saberá o que fazer. Se continuar esquecendo, verifique se o Gateway está usando o mesmo
    workspace em todas as execuções.

    Docs: [Memória](/pt-BR/concepts/memory), [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Arquivos de memória vivem no disco e persistem até você excluí-los. O limite é seu
    armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto do modelo,
    então conversas longas podem compactar ou truncar. É por isso que existe a
    busca em memória - ela traz de volta ao contexto apenas as partes relevantes.

    Docs: [Memória](/pt-BR/concepts/memory), [Contexto](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica de memória exige uma chave de API da OpenAI?">
    Apenas se você usar **embeddings da OpenAI**. O OAuth do Codex cobre chat/completions e
    **não** concede acesso a embeddings, então **fazer login com Codex (OAuth ou o
    login da CLI do Codex)** não ajuda na busca semântica de memória. Embeddings da OpenAI
    ainda precisam de uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Se você não definir um provedor explicitamente, o OpenClaw seleciona automaticamente um provedor quando
    consegue resolver uma chave de API (perfis de autenticação, `models.providers.*.apiKey` ou vars de ambiente).
    Ele prefere OpenAI se uma chave OpenAI for resolvida; caso contrário, Gemini se uma chave Gemini
    for resolvida; depois Voyage; depois Mistral. Se nenhuma chave remota estiver disponível, a
    busca de memória permanece desativada até você configurá-la. Se você tiver um caminho de modelo local
    configurado e presente, o OpenClaw
    prefere `local`. Ollama é compatível quando você define explicitamente
    `memorySearch.provider = "ollama"`.

    Se preferir ficar local, defina `memorySearch.provider = "local"` (e opcionalmente
    `memorySearch.fallback = "none"`). Se quiser embeddings Gemini, defina
    `memorySearch.provider = "gemini"` e forneça `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Oferecemos suporte a modelos de embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama ou local**
    - consulte [Memória](/pt-BR/concepts/memory) para detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde as coisas ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não - **o estado do OpenClaw é local**, mas **serviços externos ainda veem o que você envia a eles**.

    - **Local por padrão:** sessões, arquivos de memória, configuração e workspace ficam no gateway host
      (`~/.openclaw` + diretório do seu workspace).
    - **Remoto por necessidade:** mensagens que você envia a provedores de modelo (Anthropic/OpenAI/etc.) vão para
      suas APIs, e plataformas de chat (WhatsApp/Telegram/Slack/etc.) armazenam dados de mensagens em seus
      servidores.
    - **Você controla a superfície:** usar modelos locais mantém prompts na sua máquina, mas o
      tráfego de canal ainda passa pelos servidores do canal.

    Relacionado: [Workspace do agente](/pt-BR/concepts/agent-workspace), [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                         | Finalidade                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuração principal (JSON5)                                     |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importação legada de OAuth (copiada para perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfis de autenticação (OAuth, chaves de API e `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload opcional de segredo baseado em arquivo para provedores `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Arquivo de compatibilidade legado (entradas estáticas `api_key` removidas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado do provedor (por exemplo `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sessions)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Histórico e estado de conversa (por agente)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadados de sessão (por agente)                                   |

    Caminho legado de agente único: `~/.openclaw/agent/*` (migrado por `openclaw doctor`).

    Seu **workspace** (`AGENTS.md`, arquivos de memória, Skills etc.) é separado e configurado por `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde devem ficar AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Esses arquivos ficam no **workspace do agente**, não em `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou fallback legado `memory.md` quando `MEMORY.md` está ausente),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canal/provedor, perfis de autenticação, sessões, logs
      e Skills compartilhadas (`~/.openclaw/skills`).

    O workspace padrão é `~/.openclaw/workspace`, configurável por:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquece" após uma reinicialização, confirme que o Gateway está usando o mesmo
    workspace em todos os inícios (e lembre-se: o modo remoto usa o workspace do **gateway host**,
    não o do seu laptop local).

    Dica: se você quiser um comportamento ou preferência durável, peça ao bot para **gravar isso em
    AGENTS.md ou MEMORY.md** em vez de depender do histórico de chat.

    Consulte [Workspace do agente](/pt-BR/concepts/agent-workspace) e [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque seu **workspace do agente** em um repositório git **privado** e faça backup em algum lugar
    privado (por exemplo, GitHub privado). Isso captura memória + arquivos AGENTS/SOUL/USER
    e permite restaurar a "mente" do assistente depois.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens ou payloads secretos criptografados).
    Se precisar de uma restauração completa, faça backup separado do workspace e do diretório de estado
    (veja a pergunta de migração acima).

    Docs: [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte o guia dedicado: [Desinstalar](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Os agentes podem trabalhar fora do workspace?">
    Sim. O workspace é o **cwd padrão** e âncora de memória, não um sandbox rígido.
    Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros
    locais do host, a menos que o sandboxing esteja habilitado. Se você precisar de isolamento, use
    [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou configurações de sandbox por agente. Se você
    quiser que um repositório seja o diretório de trabalho padrão, aponte o
    `workspace` desse agente para a raiz do repositório. O repositório OpenClaw é apenas código-fonte; mantenha o
    workspace separado, a menos que você queira intencionalmente que o agente trabalhe dentro dele.

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

  <Accordion title="Modo remoto: onde fica o armazenamento de sessões?">
    O estado da sessão pertence ao **gateway host**. Se você estiver em modo remoto, o armazenamento de sessões que importa fica na máquina remota, não no seu laptop local. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de configuração

<AccordionGroup>
  <Accordion title="Qual é o formato da configuração? Onde ela fica?">
    O OpenClaw lê uma configuração **JSON5** opcional de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se o arquivo estiver ausente, ele usa padrões relativamente seguros (incluindo um workspace padrão de `~/.openclaw/workspace`).

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

    - `gateway.remote.token` / `.password` **não** habilitam, por si só, a autenticação do gateway local.
    - Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` estiver indefinido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha fechada (sem fallback remoto mascarando).
    - Configurações de Control UI com segredo compartilhado autenticam por `connect.params.auth.token` ou `connect.params.auth.password` (armazenados nas configurações do app/UI). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de solicitação no lugar disso. Evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos loopback no mesmo host ainda **não** satisfazem a autenticação trusted-proxy. O proxy confiável deve ser uma fonte não-loopback configurada.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw impõe autenticação do gateway por padrão, inclusive em loopback. No caminho padrão normal isso significa autenticação por token: se nenhum caminho explícito de autenticação estiver configurado, a inicialização do gateway resolve para o modo token e gera um automaticamente, salvando-o em `gateway.auth.token`, então clientes WS locais **precisam autenticar**. Isso bloqueia outros processos locais de chamar o Gateway.

    Se você preferir um caminho de autenticação diferente, pode escolher explicitamente o modo senha (ou, para proxies reversos com reconhecimento de identidade não-loopback, `trusted-proxy`). Se você **realmente** quiser loopback aberto, defina explicitamente `gateway.auth.mode: "none"` na sua configuração. O Doctor pode gerar um token para você a qualquer momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Preciso reiniciar após mudar a configuração?">
    O Gateway observa a configuração e oferece suporte a hot-reload:

    - `gateway.reload.mode: "hybrid"` (padrão): aplica a quente mudanças seguras, reinicia para mudanças críticas
    - `hot`, `restart`, `off` também são compatíveis

  </Accordion>

  <Accordion title="Como desativo as taglines engraçadas da CLI?">
    Defina `cli.banner.taglineMode` na configuração:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta o texto da tagline, mas mantém a linha de título/versão do banner.
    - `default`: usa `All your chats, one OpenClaw.` sempre.
    - `random`: taglines engraçadas/sazonais rotativas (comportamento padrão).
    - Se você não quiser nenhum banner, defina a env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito web search (e web fetch)?">
    `web_fetch` funciona sem chave de API. `web_search` depende do
    provedor selecionado:

    - Provedores com API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily, exigem sua configuração normal de chave de API.
    - Ollama Web Search não usa chave, mas usa o host Ollama configurado e exige `ollama signin`.
    - DuckDuckGo não usa chave, mas é uma integração não oficial baseada em HTML.
    - SearXNG é sem chave/self-hosted; configure `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** execute `openclaw configure --section web` e escolha um provedor.
    Alternativas por variável de ambiente:

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

    A configuração específica de provedor para web-search agora vive em `plugins.entries.<plugin>.config.webSearch.*`.
    Caminhos legados de provedor `tools.web.search.*` ainda carregam temporariamente por compatibilidade, mas não devem ser usados em novas configurações.
    A configuração de fallback de web-fetch do Firecrawl vive em `plugins.entries.firecrawl.config.webFetch.*`.

    Observações:

    - Se você usar allowlists, adicione `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` é habilitado por padrão (a menos que seja explicitamente desabilitado).
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detecta automaticamente o primeiro provedor de fallback de fetch pronto a partir das credenciais disponíveis. Hoje o provedor empacotado é o Firecrawl.
    - Daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Docs: [Ferramentas web](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recupero e evito isso?">
    `config.apply` substitui a **configuração inteira**. Se você enviar um objeto parcial, todo o
    resto será removido.

    Recuperação:

    - Restaure do backup (git ou uma cópia de `~/.openclaw/openclaw.json`).
    - Se você não tiver backup, execute `openclaw doctor` novamente e reconfigure canais/modelos.
    - Se isso foi inesperado, abra um bug e inclua sua última configuração conhecida ou qualquer backup.
    - Um agente local de programação geralmente consegue reconstruir uma configuração funcional a partir de logs ou histórico.

    Como evitar:

    - Use `openclaw config set` para pequenas mudanças.
    - Use `openclaw configure` para edições interativas.
    - Use `config.schema.lookup` primeiro quando não tiver certeza sobre um caminho exato ou formato de campo; ele retorna um nó superficial do schema mais resumos imediatos dos filhos para aprofundamento.
    - Use `config.patch` para edições RPC parciais; mantenha `config.apply` apenas para substituição completa da configuração.
    - Se você estiver usando a ferramenta `gateway`, exclusiva do owner, em uma execução de agente, ela ainda rejeitará gravações em `tools.exec.ask` / `tools.exec.security` (incluindo aliases legados `tools.bash.*` que são normalizados para os mesmos caminhos protegidos de exec).

    Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    O padrão comum é **um Gateway** (por exemplo, Raspberry Pi) mais **nodes** e **agents**:

    - **Gateway (central):** é o proprietário dos canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos):** Macs/iOS/Android conectam-se como periféricos e expõem ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** cérebros/workspaces separados para papéis especiais (por exemplo, "Hetzner ops", "Personal data").
    - **Subagentes:** iniciam trabalho em segundo plano a partir de um agente principal quando você deseja paralelismo.
    - **TUI:** conecte-se ao Gateway e alterne agentes/sessões.

    Docs: [Nodes](/pt-BR/nodes), [Acesso remoto](/pt-BR/gateway/remote), [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode rodar headless?">
    Sim. É uma opção de configuração:

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

    O padrão é `false` (com interface). O modo headless tem mais chance de disparar verificações anti-bot em alguns sites. Consulte [Navegador](/pt-BR/tools/browser).

    O modo headless usa o **mesmo motor Chromium** e funciona para a maioria das automações (formulários, cliques, scraping, logins). As principais diferenças:

    - Sem janela visível do navegador (use screenshots se precisar de elementos visuais).
    - Alguns sites são mais rígidos com automação em modo headless (CAPTCHAs, anti-bot).
      Por exemplo, X/Twitter frequentemente bloqueia sessões headless.

  </Accordion>

  <Accordion title="Como uso Brave para controle do navegador?">
    Defina `browser.executablePath` para seu binário do Brave (ou qualquer navegador baseado em Chromium) e reinicie o Gateway.
    Consulte os exemplos completos de configuração em [Navegador](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos e nodes

<AccordionGroup>
  <Accordion title="Como os comandos se propagam entre Telegram, gateway e nodes?">
    Mensagens do Telegram são tratadas pelo **gateway**. O gateway executa o agente e
    só então chama nodes pelo **Gateway WebSocket** quando uma ferramenta de node é necessária:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes não veem tráfego de provedor de entrada; eles recebem apenas chamadas RPC de node.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway estiver hospedado remotamente?">
    Resposta curta: **pareie seu computador como um node**. O Gateway é executado em outro lugar, mas pode
    chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo Gateway WebSocket.

    Configuração típica:

    1. Execute o Gateway no host sempre ligado (VPS/servidor doméstico).
    2. Coloque o gateway host + seu computador na mesma tailnet.
    3. Garanta que o Gateway WS esteja acessível (bind tailnet ou túnel SSH).
    4. Abra o app macOS localmente e conecte em modo **Remote over SSH** (ou tailnet direto)
       para que ele possa se registrar como um node.
    5. Aprove o node no Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nenhuma bridge TCP separada é necessária; nodes se conectam pelo Gateway WebSocket.

    Lembrete de segurança: parear um node macOS permite `system.run` nessa máquina. Pareie apenas
    dispositivos em que você confia e revise [Segurança](/pt-BR/gateway/security).

    Docs: [Nodes](/pt-BR/nodes), [Protocolo do Gateway](/pt-BR/gateway/protocol), [modo remoto no macOS](/pt-BR/platforms/mac/remote), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. E agora?">
    Verifique o básico:

    - O Gateway está em execução: `openclaw gateway status`
    - Saúde do Gateway: `openclaw status`
    - Saúde do canal: `openclaw channels status`

    Depois verifique autenticação e roteamento:

    - Se você usa Tailscale Serve, verifique se `gateway.auth.allowTailscale` está definido corretamente.
    - Se você se conecta por túnel SSH, confirme que o túnel local está ativo e apontando para a porta correta.
    - Confirme que suas allowlists (DM ou grupo) incluem sua conta.

    Docs: [Tailscale](/pt-BR/gateway/tailscale), [Acesso remoto](/pt-BR/gateway/remote), [Canais](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem conversar entre si (local + VPS)?">
    Sim. Não há uma bridge "bot-to-bot" embutida, mas você pode conectar isso de algumas
    formas confiáveis:

    **Mais simples:** use um canal de chat normal ao qual ambos os bots tenham acesso (Telegram/Slack/WhatsApp).
    Faça o Bot A enviar uma mensagem ao Bot B e então deixe o Bot B responder normalmente.

    **Bridge de CLI (genérica):** execute um script que chama o outro Gateway com
    `openclaw agent --message ... --deliver`, direcionando para um chat onde o outro bot
    escuta. Se um bot estiver em uma VPS remota, aponte sua CLI para esse Gateway remoto
    via SSH/Tailscale (consulte [Acesso remoto](/pt-BR/gateway/remote)).

    Padrão de exemplo (execute em uma máquina que consiga alcançar o Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Dica: adicione um guardrail para que os dois bots não entrem em loop infinito (somente menção,
    allowlists de canal ou uma regra de "não responder a mensagens de bot").

    Docs: [Acesso remoto](/pt-BR/gateway/remote), [CLI do Agente](/cli/agent), [Envio do agente](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para vários agentes?">
    Não. Um Gateway pode hospedar vários agentes, cada um com seu próprio workspace, padrões de modelo
    e roteamento. Essa é a configuração normal e é muito mais barata e simples do que executar
    uma VPS por agente.

    Use VPSs separadas apenas quando precisar de isolamento rígido (limites de segurança) ou de
    configurações muito diferentes que você não queira compartilhar. Caso contrário, mantenha um Gateway e
    use vários agentes ou subagentes.

  </Accordion>

  <Accordion title="Há vantagem em usar um node no meu laptop pessoal em vez de SSH a partir de uma VPS?">
    Sim - nodes são a forma de primeira classe de alcançar seu laptop a partir de um Gateway remoto, e eles
    liberam mais do que acesso shell. O Gateway roda em macOS/Linux (Windows via WSL2) e é
    leve (uma pequena VPS ou máquina classe Raspberry Pi é suficiente; 4 GB de RAM já é bastante), então uma
    configuração comum é um host sempre ligado mais seu laptop como node.

    - **Sem SSH de entrada necessário.** Nodes se conectam de saída ao Gateway WebSocket e usam pareamento de dispositivo.
    - **Controles de execução mais seguros.** `system.run` é controlado por allowlists/aprovações de node nesse laptop.
    - **Mais ferramentas do dispositivo.** Nodes expõem `canvas`, `camera` e `screen` além de `system.run`.
    - **Automação de navegador local.** Mantenha o Gateway em uma VPS, mas execute o Chrome localmente por um host de node no laptop, ou conecte-se ao Chrome local do host via Chrome MCP.

    SSH é adequado para acesso shell ad hoc, mas nodes são mais simples para fluxos contínuos de agentes e
    automação de dispositivo.

    Docs: [Nodes](/pt-BR/nodes), [CLI de Nodes](/cli/nodes), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Nodes executam um serviço de gateway?">
    Não. Apenas **um gateway** deve ser executado por host, a menos que você esteja executando perfis isolados intencionalmente (consulte [Múltiplos gateways](/pt-BR/gateway/multiple-gateways)). Nodes são periféricos que se conectam
    ao gateway (nodes iOS/Android ou "modo node" no app de barra de menu do macOS). Para hosts de node headless
    e controle por CLI, consulte [CLI de host de node](/cli/node).

    É necessário um reinício completo para mudanças em `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Existe uma forma API / RPC de aplicar configuração?">
    Sim.

    - `config.schema.lookup`: inspeciona uma subárvore da configuração com seu nó superficial do schema, dica de UI correspondente e resumos imediatos dos filhos antes de gravar
    - `config.get`: busca o snapshot atual + hash
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições RPC)
    - `config.apply`: valida + substitui a configuração completa e então reinicia
    - A ferramenta de runtime `gateway`, exclusiva do owner, ainda se recusa a reescrever `tools.exec.ask` / `tools.exec.security`; aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec

  </Accordion>

  <Accordion title="Configuração mínima razoável para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Isso define seu workspace e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro Tailscale em uma VPS e conecto a partir do meu Mac?">
    Etapas mínimas:

    1. **Instalar + login na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + login no seu Mac**
       - Use o app do Tailscale e faça login na mesma tailnet.
    3. **Habilitar MagicDNS (recomendado)**
       - No console de administração do Tailscale, habilite o MagicDNS para que a VPS tenha um nome estável.
    4. **Usar o hostname da tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se você quiser a Control UI sem SSH, use Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o gateway vinculado ao loopback e expõe HTTPS via Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um node Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **Control UI + WS do Gateway**. Nodes conectam-se pelo mesmo endpoint WS do Gateway.

    Configuração recomendada:

    1. **Verifique se a VPS + Mac estão na mesma tailnet**.
    2. **Use o app macOS em modo Remote** (o alvo SSH pode ser o hostname da tailnet).
       O app fará túnel da porta do Gateway e se conectará como node.
    3. **Aprove o node** no gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Discovery](/pt-BR/gateway/discovery), [modo remoto no macOS](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo laptop ou apenas adicionar um node?">
    Se você só precisa de **ferramentas locais** (tela/câmera/exec) no segundo laptop, adicione-o como um
    **node**. Isso mantém um único Gateway e evita configuração duplicada. Ferramentas locais de node são
    atualmente exclusivas do macOS, mas planejamos estendê-las para outros SOs.

    Instale um segundo Gateway apenas quando precisar de **isolamento rígido** ou dois bots totalmente separados.

    Docs: [Nodes](/pt-BR/nodes), [CLI de Nodes](/cli/nodes), [Múltiplos gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e adicionalmente carrega:

    - `.env` do diretório de trabalho atual
    - um fallback global `.env` de `~/.openclaw/.env` (também conhecido como `$OPENCLAW_STATE_DIR/.env`)

    Nenhum dos arquivos `.env` sobrescreve variáveis de ambiente existentes.

    Você também pode definir variáveis de ambiente inline na configuração (aplicadas apenas se estiverem ausentes no ambiente do processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/pt-BR/help/environment) para a precedência completa e as fontes.

  </Accordion>

  <Accordion title="Iniciei o Gateway pelo serviço e minhas variáveis de ambiente desapareceram. E agora?">
    Duas correções comuns:

    1. Coloque as chaves ausentes em `~/.openclaw/.env`, para que sejam capturadas mesmo quando o serviço não herdar o ambiente do seu shell.
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

    Isso executa seu login shell e importa apenas chaves esperadas ausentes (nunca sobrescreve). Equivalentes por var de ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas models status mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação de env do shell** está habilitada. "Shell env: off"
    **não** significa que suas variáveis de ambiente estejam ausentes - significa apenas que o OpenClaw não carregará
    seu login shell automaticamente.

    Se o Gateway roda como serviço (launchd/systemd), ele não herdará o ambiente do seu shell.
    Corrija de uma destas formas:

    1. Coloque o token em `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou habilite a importação do shell (`env.shellEnv.enabled: true`).
    3. Ou adicione-o ao bloco `env` da sua configuração (aplica-se apenas se estiver ausente).

    Então reinicie o gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Tokens do Copilot são lidos de `COPILOT_GITHUB_TOKEN` (também `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e múltiplos chats

<AccordionGroup>
  <Accordion title="Como começo uma conversa nova?">
    Envie `/new` ou `/reset` como uma mensagem independente. Consulte [Gerenciamento de sessão](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    As sessões podem expirar após `session.idleMinutes`, mas isso fica **desativado por padrão** (padrão **0**).
    Defina um valor positivo para habilitar a expiração por inatividade. Quando habilitado, a **próxima**
    mensagem após o período de inatividade inicia um novo id de sessão para essa chave de chat.
    Isso não exclui transcrições - apenas inicia uma nova sessão.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe uma forma de criar uma equipe de instâncias OpenClaw (um CEO e muitos agentes)?">
    Sim, por meio de **roteamento multiagente** e **subagentes**. Você pode criar um agente coordenador
    e vários agentes workers com seus próprios workspaces e modelos.

    Dito isso, isso é melhor visto como um **experimento divertido**. Consome muitos tokens e muitas vezes
    é menos eficiente do que usar um único bot com sessões separadas. O modelo típico que
    imaginamos é um bot com o qual você conversa, com diferentes sessões para trabalho paralelo. Esse
    bot também pode iniciar subagentes quando necessário.

    Docs: [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [CLI de Agents](/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio da tarefa? Como evito isso?">
    O contexto da sessão é limitado pela janela do modelo. Chats longos, saídas grandes de ferramentas ou muitos
    arquivos podem disparar compactação ou truncamento.

    O que ajuda:

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao mudar de assunto.
    - Mantenha contexto importante no workspace e peça ao bot para relê-lo.
    - Use subagentes para trabalhos longos ou paralelos, para que o chat principal permaneça menor.
    - Escolha um modelo com uma janela de contexto maior se isso acontecer com frequência.

  </Accordion>

  <Accordion title="Como redefino completamente o OpenClaw, mas o mantenho instalado?">
    Use o comando de reset:

    ```bash
    openclaw reset
    ```

    Reset completo não interativo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois execute a configuração novamente:

    ```bash
    openclaw onboard --install-daemon
    ```

    Observações:

    - O onboarding também oferece **Reset** se detectar uma configuração existente. Consulte [Onboarding (CLI)](/pt-BR/start/wizard).
    - Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
    - Reset de dev: `openclaw gateway --dev --reset` (somente dev; apaga configuração + credenciais + sessões + workspace de dev).

  </Accordion>

  <Accordion title='Estou recebendo erros "context too large" - como redefino ou compacto?'>
    Use uma destas opções:

    - **Compactar** (mantém a conversa, mas resume turnos antigos):

      ```
      /compact
      ```

      ou `/compact <instructions>` para orientar o resumo.

    - **Redefinir** (novo ID de sessão para a mesma chave de chat):

      ```
      /new
      /reset
      ```

    Se isso continuar acontecendo:

    - Habilite ou ajuste **session pruning** (`agents.defaults.contextPruning`) para aparar saídas antigas de ferramenta.
    - Use um modelo com uma janela de contexto maior.

    Docs: [Compactação](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning), [Gerenciamento de sessão](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este é um erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o
    `input` obrigatório. Geralmente significa que o histórico da sessão está obsoleto ou corrompido (frequentemente após threads longas
    ou uma mudança de ferramenta/schema).

    Correção: inicie uma sessão nova com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de heartbeat a cada 30 minutos?">
    Heartbeats são executados a cada **30m** por padrão (**1h** ao usar autenticação OAuth). Ajuste ou desative:

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

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e
    cabeçalhos markdown como `# Heading`), o OpenClaw ignora a execução de heartbeat para economizar chamadas de API.
    Se o arquivo estiver ausente, o heartbeat ainda é executado e o modelo decide o que fazer.

    Overrides por agente usam `agents.list[].heartbeat`. Docs: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo de WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta**, então se você estiver no grupo, o OpenClaw poderá vê-lo.
    Por padrão, respostas em grupo são bloqueadas até que você permita remetentes (`groupPolicy: "allowlist"`).

    Se você quiser que apenas **você** possa disparar respostas em grupo:

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

  <Accordion title="Como obtenho o JID de um grupo de WhatsApp?">
    Opção 1 (mais rápida): acompanhe os logs e envie uma mensagem de teste no grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Procure por `chatId` (ou `from`) terminando em `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opção 2 (se já estiver configurado/na allowlist): liste grupos a partir da configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/pt-BR/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns:

    - O bloqueio por menção está ativado (padrão). Você precisa @mencionar o bot (ou corresponder a `mentionPatterns`).
    - Você configurou `channels.whatsapp.groups` sem `"*"` e o grupo não está na allowlist.

    Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com DMs?">
    Chats diretos colapsam para a sessão principal por padrão. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram / threads do Discord são sessões separadas. Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos workspaces e agentes posso criar?">
    Sem limites rígidos. Dezenas (até centenas) funcionam bem, mas observe:

    - **Crescimento de disco:** sessões + transcrições vivem em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens:** mais agentes significam mais uso simultâneo de modelo.
    - **Sobrecarga operacional:** perfis de autenticação por agente, workspaces e roteamento de canal.

    Dicas:

    - Mantenha um workspace **ativo** por agente (`agents.defaults.workspace`).
    - Pode sessões antigas (apague JSONL ou entradas do store) se o disco crescer.
    - Use `openclaw doctor` para identificar workspaces soltos e incompatibilidades de perfil.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack), e como devo configurar isso?">
    Sim. Use **Roteamento Multiagente** para executar vários agentes isolados e rotear mensagens de entrada por
    canal/conta/peer. Slack é compatível como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não faz "qualquer coisa que um humano pode" - anti-bot, CAPTCHAs e MFA ainda podem
    bloquear a automação. Para o controle de navegador mais confiável, use Chrome MCP local no host,
    ou use CDP na máquina que realmente executa o navegador.

    Configuração de melhores práticas:

    - Gateway host sempre ligado (VPS/Mac mini).
    - Um agente por função (bindings).
    - Canal(is) do Slack vinculados a esses agentes.
    - Navegador local via Chrome MCP ou um node quando necessário.

    Docs: [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack),
    [Navegador](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos: padrões, seleção, aliases, troca

<AccordionGroup>
  <Accordion title='O que é o "modelo padrão"?'>
    O modelo padrão do OpenClaw é o que você definir em:

    ```
    agents.defaults.model.primary
    ```

    Modelos são referenciados como `provider/model` (exemplo: `openai/gpt-5.4`). Se você omitir o provedor, o OpenClaw primeiro tenta um alias, depois uma correspondência única de provedor configurado para aquele id de modelo exato, e só então recorre ao provedor padrão configurado como um caminho legado de compatibilidade. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido. Ainda assim, você deve definir explicitamente **`provider/model`**.

  </Accordion>

  <Accordion title="Qual modelo vocês recomendam?">
    **Padrão recomendado:** use o modelo mais forte e de última geração disponível na sua pilha de provedores.
    **Para agentes com ferramentas habilitadas ou entrada não confiável:** priorize força do modelo em vez de custo.
    **Para chat rotineiro/baixo risco:** use modelos de fallback mais baratos e roteie por papel do agente.

    O MiniMax tem seus próprios docs: [MiniMax](/pt-BR/providers/minimax) e
    [Modelos locais](/pt-BR/gateway/local-models).

    Regra prática: use o **melhor modelo que você puder pagar** para trabalho de alto risco e um modelo
    mais barato para chat rotineiro ou resumos. Você pode rotear modelos por agente e usar subagentes para
    paralelizar tarefas longas (cada subagente consome tokens). Consulte [Modelos](/pt-BR/concepts/models) e
    [Subagentes](/pt-BR/tools/subagents).

    Aviso forte: modelos mais fracos/superquantizados são mais vulneráveis a injeção
    de prompt e comportamento inseguro. Consulte [Segurança](/pt-BR/gateway/security).

    Mais contexto: [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Como troco de modelo sem apagar minha configuração?">
    Use **comandos de modelo** ou edite apenas os campos de **modelo**. Evite substituições completas da configuração.

    Opções seguras:

    - `/model` no chat (rápido, por sessão)
    - `openclaw models set ...` (atualiza apenas a configuração do modelo)
    - `openclaw configure --section model` (interativo)
    - edite `agents.defaults.model` em `~/.openclaw/openclaw.json`

    Evite `config.apply` com um objeto parcial, a menos que queira substituir a configuração inteira.
    Para edições RPC, inspecione primeiro com `config.schema.lookup` e prefira `config.patch`. O payload de lookup fornece o caminho normalizado, docs/restrições superficiais do schema e resumos imediatos dos filhos.
    para atualizações parciais.
    Se você sobrescreveu a configuração, restaure do backup ou execute novamente `openclaw doctor` para reparar.

    Docs: [Modelos](/pt-BR/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usar modelos self-hosted (llama.cpp, vLLM, Ollama)?">
    Sim. Ollama é o caminho mais fácil para modelos locais.

    Configuração mais rápida:

    1. Instale o Ollama em `https://ollama.com/download`
    2. Faça pull de um modelo local como `ollama pull glm-4.7-flash`
    3. Se quiser modelos em nuvem também, execute `ollama signin`
    4. Execute `openclaw onboard` e escolha `Ollama`
    5. Escolha `Local` ou `Cloud + Local`

    Observações:

    - `Cloud + Local` oferece modelos em nuvem mais seus modelos locais do Ollama
    - modelos em nuvem como `kimi-k2.5:cloud` não precisam de um pull local
    - para troca manual, use `openclaw models list` e `openclaw models set ollama/<model>`

    Observação de segurança: modelos menores ou fortemente quantizados são mais vulneráveis a injeção
    de prompt. Recomendamos fortemente **modelos grandes** para qualquer bot que possa usar ferramentas.
    Se ainda assim quiser modelos pequenos, habilite sandboxing e allowlists estritas de ferramentas.

    Docs: [Ollama](/pt-BR/providers/ollama), [Modelos locais](/pt-BR/gateway/local-models),
    [Provedores de modelo](/pt-BR/concepts/model-providers), [Segurança](/pt-BR/gateway/security),
    [Sandboxing](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="O que OpenClaw, Flawd e Krill usam como modelos?">
    - Essas implantações podem diferir e mudar ao longo do tempo; não há uma recomendação fixa de provedor.
    - Verifique a configuração atual de runtime em cada gateway com `openclaw models status`.
    - Para agentes sensíveis à segurança/com ferramentas habilitadas, use o modelo mais forte e de última geração disponível.
  </Accordion>

  <Accordion title="Como troco de modelo na hora (sem reiniciar)?">
    Use o comando `/model` como uma mensagem independente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Esses são os aliases embutidos. Aliases personalizados podem ser adicionados por `agents.defaults.models`.

    Você pode listar modelos disponíveis com `/model`, `/model list` ou `/model status`.

    `/model` (e `/model list`) mostra um seletor compacto e numerado. Selecione por número:

    ```
    /model 3
    ```

    Você também pode forçar um perfil de autenticação específico para o provedor (por sessão):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Dica: `/model status` mostra qual agente está ativo, qual arquivo `auth-profiles.json` está sendo usado e qual perfil de autenticação será tentado em seguida.
    Ele também mostra o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponível.

    **Como removo um profile fixado com @profile?**

    Execute novamente `/model` **sem** o sufixo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se quiser voltar ao padrão, escolha-o em `/model` (ou envie `/model <default provider/model>`).
    Use `/model status` para confirmar qual perfil de autenticação está ativo.

  </Accordion>

  <Accordion title="Posso usar GPT 5.2 para tarefas diárias e Codex 5.3 para programação?">
    Sim. Defina um como padrão e troque quando necessário:

    - **Troca rápida (por sessão):** `/model gpt-5.4` para tarefas diárias, `/model openai-codex/gpt-5.4` para programação com Codex OAuth.
    - **Padrão + troca:** defina `agents.defaults.model.primary` como `openai/gpt-5.4` e então mude para `openai-codex/gpt-5.4` ao programar (ou o contrário).
    - **Subagentes:** roteie tarefas de programação para subagentes com um modelo padrão diferente.

    Consulte [Modelos](/pt-BR/concepts/models) e [Comandos slash](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como configuro o modo rápido para GPT 5.4?">
    Use uma alternância por sessão ou um padrão de configuração:

    - **Por sessão:** envie `/fast on` enquanto a sessão estiver usando `openai/gpt-5.4` ou `openai-codex/gpt-5.4`.
    - **Padrão por modelo:** defina `agents.defaults.models["openai/gpt-5.4"].params.fastMode` como `true`.
    - **Também com Codex OAuth:** se você também usa `openai-codex/gpt-5.4`, defina a mesma flag lá.

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

    Para OpenAI, fast mode é mapeado para `service_tier = "priority"` em solicitações nativas Responses compatíveis. O `/fast` da sessão tem precedência sobre padrões da configuração.

    Consulte [Raciocínio e modo rápido](/pt-BR/tools/thinking) e [Modo rápido da OpenAI](/pt-BR/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Por que vejo "Model ... is not allowed" e depois nenhuma resposta?'>
    Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e quaisquer
    overrides de sessão. Escolher um modelo que não esteja nessa lista retorna:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Esse erro é retornado **em vez de** uma resposta normal. Correção: adicione o modelo a
    `agents.defaults.models`, remova a allowlist ou escolha um modelo em `/model list`.

  </Accordion>

  <Accordion title='Por que vejo "Unknown model: minimax/MiniMax-M2.7"?'>
    Isso significa que o **provedor não está configurado** (não foi encontrada configuração nem perfil de
    autenticação do provedor MiniMax), então o modelo não pode ser resolvido.

    Checklist de correção:

    1. Atualize para uma versão atual do OpenClaw (ou execute a partir da fonte `main`) e então reinicie o gateway.
    2. Verifique se o MiniMax está configurado (assistente ou JSON), ou se existe autenticação MiniMax
       em env/perfis de autenticação para que o provedor correspondente possa ser injetado
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       armazenado para `minimax-portal`).
    3. Use o id de modelo exato (sensível a maiúsculas e minúsculas) para seu caminho de autenticação:
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` para configuração
       com chave de API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuração
       com OAuth.
    4. Execute:

       ```bash
       openclaw models list
       ```

       e escolha da lista (ou `/model list` no chat).

    Consulte [MiniMax](/pt-BR/providers/minimax) e [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar MiniMax como padrão e OpenAI para tarefas complexas?">
    Sim. Use **MiniMax como padrão** e troque de modelo **por sessão** quando necessário.
    Fallbacks são para **erros**, não para "tarefas difíceis", então use `/model` ou um agente separado.

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

    Então:

    ```
    /model gpt
    ```

    **Opção B: agentes separados**

    - Agente A padrão: MiniMax
    - Agente B padrão: OpenAI
    - Roteie por agente ou use `/agent` para trocar

    Docs: [Modelos](/pt-BR/concepts/models), [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [MiniMax](/pt-BR/providers/minimax), [OpenAI](/pt-BR/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt são atalhos embutidos?">
    Sim. O OpenClaw envia alguns atalhos padrão (aplicados apenas quando o modelo existe em `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se você definir seu próprio alias com o mesmo nome, o seu valor prevalece.

  </Accordion>

  <Accordion title="Como defino/faço override de atalhos (aliases) de modelo?">
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

    Então `/model sonnet` (ou `/<alias>` quando compatível) resolve para esse id de modelo.

  </Accordion>

  <Accordion title="Como adiciono modelos de outros provedores como OpenRouter ou Z.AI?">
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

    Se você referenciar um provedor/modelo, mas faltar a chave necessária do provedor, receberá um erro de autenticação em runtime (por exemplo `No API key found for provider "zai"`).

    **No API key found for provider após adicionar um novo agente**

    Isso geralmente significa que o **novo agente** tem um armazenamento de autenticação vazio. A autenticação é por agente e
    fica em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opções de correção:

    - Execute `openclaw agents add <id>` e configure a autenticação durante o assistente.
    - Ou copie `auth-profiles.json` do `agentDir` do agente principal para o `agentDir` do novo agente.

    **Não** reutilize `agentDir` entre agentes; isso causa colisões de autenticação/sessão.

  </Accordion>
</AccordionGroup>

## Failover de modelo e "All models failed"

<AccordionGroup>
  <Accordion title="Como o failover funciona?">
    O failover acontece em dois estágios:

    1. **Rotação de perfil de autenticação** dentro do mesmo provedor.
    2. **Fallback de modelo** para o próximo modelo em `agents.defaults.model.fallbacks`.

    Cooldowns se aplicam a perfis com falha (backoff exponencial), então o OpenClaw pode continuar respondendo mesmo quando um provedor está com limite de taxa ou temporariamente falhando.

    O bucket de limite de taxa inclui mais do que respostas simples `429`. O OpenClaw
    também trata mensagens como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limites
    periódicos de janela de uso (`weekly/monthly limit reached`) como limites de taxa
    dignos de failover.

    Algumas respostas que parecem de cobrança não são `402`, e algumas respostas HTTP `402`
    também permanecem nesse bucket transitório. Se um provedor retornar
    texto explícito de cobrança em `401` ou `403`, o OpenClaw ainda pode manter isso na
    faixa de cobrança, mas correspondências de texto específicas de provedor permanecem restritas ao
    provedor que as possui (por exemplo OpenRouter `Key limit exceeded`). Se uma mensagem `402`
    parecer um limite de janela de uso tentável novamente ou
    limite de gasto de organização/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), o OpenClaw a trata como
    `rate_limit`, não como uma desativação longa por cobrança.

    Erros de estouro de contexto são diferentes: assinaturas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` ou `ollama error: context length
    exceeded` permanecem no caminho de compactação/nova tentativa em vez de avançar o fallback
    de modelo.

    O texto genérico de erro de servidor é intencionalmente mais estreito do que "qualquer coisa com
    unknown/error". O OpenClaw trata formas transitórias restritas ao provedor
    como Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, erros de stop-reason como `Unhandled stop reason:
    error`, payloads JSON `api_error` com texto transitório de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) e erros de provedor ocupado, como `ModelNotReadyException`, como
    sinais de timeout/sobrecarga dignos de failover quando o contexto do provedor
    corresponde.
    Texto genérico de fallback interno como `LLM request failed with an unknown
    error.` permanece conservador e não aciona fallback de modelo por si só.

  </Accordion>

  <Accordion title='O que significa "No credentials found for profile anthropic:default"?'>
    Isso significa que o sistema tentou usar o ID de perfil de autenticação `anthropic:default`, mas não conseguiu encontrar credenciais para ele no armazenamento de autenticação esperado.

    **Checklist de correção:**

    - **Confirme onde os perfis de autenticação ficam** (caminhos novos vs legados)
      - Atual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legado: `~/.openclaw/agent/*` (migrado por `openclaw doctor`)
    - **Confirme que sua variável de ambiente foi carregada pelo Gateway**
      - Se você definiu `ANTHROPIC_API_KEY` no shell, mas executa o Gateway por systemd/launchd, ele pode não herdá-la. Coloque-a em `~/.openclaw/.env` ou habilite `env.shellEnv`.
    - **Verifique se está editando o agente correto**
      - Configurações multiagente significam que pode haver vários arquivos `auth-profiles.json`.
    - **Valide status de modelo/autenticação**
      - Use `openclaw models status` para ver modelos configurados e se os provedores estão autenticados.

    **Checklist de correção para "No credentials found for profile anthropic"**

    Isso significa que a execução está fixada em um perfil de autenticação Anthropic, mas o Gateway
    não consegue encontrá-lo no armazenamento de autenticação.

    - **Use Claude CLI**
      - Execute `openclaw models auth login --provider anthropic --method cli --set-default` no gateway host.
    - **Se você quiser usar uma chave de API em vez disso**
      - Coloque `ANTHROPIC_API_KEY` em `~/.openclaw/.env` no **gateway host**.
      - Limpe qualquer ordem fixada que force um perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirme que está executando comandos no gateway host**
      - Em modo remoto, perfis de autenticação vivem na máquina do gateway, não no seu laptop.

  </Accordion>

  <Accordion title="Por que ele também tentou Google Gemini e falhou?">
    Se a configuração do seu modelo incluir Google Gemini como fallback (ou você trocou para um atalho Gemini), o OpenClaw irá tentá-lo durante o fallback de modelo. Se você não configurou credenciais do Google, verá `No API key found for provider "google"`.

    Correção: forneça autenticação do Google ou remova/evite modelos do Google em `agents.defaults.model.fallbacks` / aliases, para que o fallback não roteie para lá.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: o histórico da sessão contém **blocos de raciocínio sem assinaturas** (frequentemente de
    um stream abortado/parcial). O Google Antigravity exige assinaturas para blocos de raciocínio.

    Correção: o OpenClaw agora remove blocos de raciocínio sem assinatura para Google Antigravity Claude. Se ainda aparecer, inicie uma **sessão nova** ou defina `/thinking off` para esse agente.

  </Accordion>
</AccordionGroup>

## Perfis de autenticação: o que são e como gerenciá-los

Relacionado: [/concepts/oauth](/pt-BR/concepts/oauth) (fluxos OAuth, armazenamento de tokens, padrões multi-conta)

<AccordionGroup>
  <Accordion title="O que é um perfil de autenticação?">
    Um perfil de autenticação é um registro nomeado de credencial (OAuth ou chave de API) vinculado a um provedor. Os perfis vivem em:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quais são IDs típicos de perfil?">
    O OpenClaw usa IDs com prefixo do provedor, como:

    - `anthropic:default` (comum quando não existe identidade de e-mail)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que você escolher (por exemplo `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controlar qual perfil de autenticação é tentado primeiro?">
    Sim. A configuração oferece suporte a metadados opcionais para perfis e uma ordenação por provedor (`auth.order.<provider>`). Isso **não** armazena segredos; mapeia IDs para provedor/modo e define a ordem de rotação.

    O OpenClaw pode ignorar temporariamente um perfil se ele estiver em um curto **cooldown** (limites de taxa/timeouts/falhas de autenticação) ou em um estado mais longo de **disabled** (cobrança/créditos insuficientes). Para inspecionar isso, execute `openclaw models status --json` e verifique `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Cooldowns de limite de taxa podem ter escopo por modelo. Um perfil que está em cooldown
    para um modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor,
    enquanto janelas de cobrança/desativação ainda bloqueiam o perfil inteiro.

    Você também pode definir um override de ordem **por agente** (armazenado no `auth-profiles.json` desse agente) via CLI:

    ```bash
    # Usa por padrão o agente padrão configurado (omita --agent)
    openclaw models auth order get --provider anthropic

    # Trava a rotação em um único perfil (tente apenas este)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou defina uma ordem explícita (fallback dentro do provedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Limpa o override (volta para config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para