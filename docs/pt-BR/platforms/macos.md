---
read_when:
    - Implementando recursos do aplicativo macOS
    - Alterando o ciclo de vida do gateway ou a bridge de node no macOS
summary: Aplicativo complementar do OpenClaw para macOS (barra de menus + broker do gateway)
title: Aplicativo macOS
x-i18n:
    generated_at: "2026-04-24T06:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

O aplicativo macOS é o **complemento de barra de menus** do OpenClaw. Ele controla permissões,
gerencia/conecta ao Gateway localmente (launchd ou manual) e expõe capacidades do macOS
ao agente como um node.

## O que ele faz

- Mostra notificações nativas e status na barra de menus.
- Controla prompts de TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Executa ou se conecta ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Camera, Screen Recording, `system.run`).
- Inicia o serviço local de host node em modo **remote** (launchd) e o interrompe em modo **local**.
- Opcionalmente hospeda **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob demanda via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado do Gateway).

## Modo local versus remoto

- **Local** (padrão): o app se conecta a um Gateway local já em execução, se presente;
  caso contrário, ativa o serviço launchd via `openclaw gateway install`.
- **Remote**: o app se conecta a um Gateway via SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço de host node** local para que o Gateway remoto consiga alcançar este Mac.
  O app não cria o Gateway como processo filho.
  A descoberta do Gateway agora prefere nomes MagicDNS do Tailscale em vez de IPs brutos de tailnet,
  então o aplicativo Mac se recupera de forma mais confiável quando IPs de tailnet mudam.

## Controle do Launchd

O app gerencia um LaunchAgent por usuário com o rótulo `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda descarrega).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

Se o LaunchAgent não estiver instalado, ative-o pelo app ou execute
`openclaw gateway install`.

## Capacidades do node (mac)

O aplicativo macOS se apresenta como um node. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

O node relata um mapa `permissions` para que os agentes possam decidir o que é permitido.

Serviço de node + IPC do app:

- Quando o serviço headless de host node está em execução (modo remoto), ele se conecta ao Gateway WS como um node.
- `system.run` é executado no aplicativo macOS (contexto UI/TCC) por um socket Unix local; prompts + saída permanecem dentro do app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de exec (`system.run`)

`system.run` é controlado por **Aprovações de exec** no aplicativo macOS (Settings → Exec approvals).
Security + ask + allowlist são armazenados localmente no Mac em:

```
~/.openclaw/exec-approvals.json
```

Exemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Observações:

- Entradas de `allowlist` são padrões glob para caminhos resolvidos de binários.
- Texto bruto de comando shell que contenha sintaxe de controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência na allowlist e exige aprovação explícita (ou inclusão do binário do shell na allowlist).
- Escolher “Always Allow” no prompt adiciona esse comando à allowlist.
- Substituições de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e depois mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de ambiente com escopo de solicitação são reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez de caminhos do wrapper. Se o desempacotamento não for seguro, nenhuma entrada de allowlist é persistida automaticamente.

## Deep links

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Dispara uma solicitação `agent` ao Gateway.
__OC_I18N_900004__
Parâmetros de consulta:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (opcional, chave de modo autônomo)

Segurança:

- Sem `key`, o app solicita confirmação.
- Sem `key`, o app aplica um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é autônoma (destinada a automações pessoais).

## Fluxo de onboarding (típico)

1. Instale e inicie o **OpenClaw.app**.
2. Conclua a checklist de permissões (prompts de TCC).
3. Certifique-se de que o modo **Local** está ativo e o Gateway está em execução.
4. Instale a CLI se quiser acesso via terminal.

## Local do diretório de estado (macOS)

Evite colocar seu diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas em nuvem.
Caminhos sustentados por sincronização podem adicionar latência e ocasionalmente causar corridas de lock/sincronização em
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele avisará e recomendará voltar para um caminho local.

## Fluxo de build e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade do gateway (CLI macOS)

Use a CLI de depuração para exercitar a mesma lógica de handshake WebSocket e descoberta do Gateway
que o aplicativo macOS usa, sem iniciar o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: substitui a configuração
- `--mode <local|remote>`: resolve a partir da configuração (padrão: config ou local)
- `--probe`: força uma nova sonda de integridade
- `--timeout <ms>`: timeout de solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: inclui gateways que seriam filtrados como “locais”
- `--timeout <ms>`: janela geral de descoberta (padrão: `2000`)
- `--json`: saída estruturada para comparação

Dica: compare com `openclaw gateway discover --json` para ver se o
pipeline de descoberta do aplicativo macOS (`local.` mais o domínio wide-area configurado, com
fallbacks de wide-area e Tailscale Serve) difere da descoberta baseada em `dns-sd`
da CLI Node.

## Infraestrutura de conexão remota (túneis SSH)

Quando o aplicativo macOS é executado em modo **Remote**, ele abre um túnel SSH para que componentes locais de UI
possam conversar com um Gateway remoto como se ele estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de integridade, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel íntegro existente
  ou o reinicia se necessário.
- **Formato SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o
  IP do node como `127.0.0.1`. Use o transporte **Direct (ws/wss)** se quiser que o IP real do cliente
  apareça (consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote)).

Para etapas de configuração, consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote). Para detalhes
do protocolo, consulte [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [Permissões no macOS](/pt-BR/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
