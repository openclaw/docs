---
read_when:
    - Implementando recursos do app do macOS
    - Alterando o ciclo de vida do gateway ou a bridge de nós no macOS
summary: App complementar do OpenClaw para macOS (barra de menu + broker do gateway)
title: app do macOS
x-i18n:
    generated_at: "2026-04-25T13:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

O app do macOS é o **complemento de barra de menu** do OpenClaw. Ele controla permissões,
gerencia/conecta-se ao Gateway localmente (launchd ou manual) e expõe capacidades do macOS ao agente como um nó.

## O que ele faz

- Mostra notificações nativas e status na barra de menu.
- Controla prompts de TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou conecta-se ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço local de host Node em modo **remoto** (launchd) e o interrompe em modo **local**.
- Opcionalmente hospeda o **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob demanda via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado do Gateway).

## Modo local vs remoto

- **Local** (padrão): o app se conecta a um Gateway local em execução, se existir;
  caso contrário, ele habilita o serviço launchd via `openclaw gateway install`.
- **Remoto**: o app se conecta a um Gateway por SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço local de host Node** para que o Gateway remoto possa alcançar este Mac.
  O app não inicia o Gateway como processo filho.
  A descoberta de Gateway agora prefere nomes MagicDNS do Tailscale em vez de IPs brutos da tailnet,
  então o app do Mac se recupera com mais confiabilidade quando os IPs da tailnet mudam.

## Controle do launchd

O app gerencia um LaunchAgent por usuário com o rótulo `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda faz unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar com um perfil nomeado.

Se o LaunchAgent não estiver instalado, habilite-o pelo app ou execute
`openclaw gateway install`.

## Capacidades do nó (mac)

O app do macOS se apresenta como um nó. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

O nó informa um mapa `permissions` para que agentes possam decidir o que é permitido.

Serviço de nó + IPC do app:

- Quando o serviço headless de host Node está em execução (modo remoto), ele se conecta ao WS do Gateway como um nó.
- `system.run` é executado no app do macOS (contexto UI/TCC) por um socket Unix local; prompts + saída permanecem no app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de exec (`system.run`)

`system.run` é controlado por **Aprovações de exec** no app do macOS (Configurações → Aprovações de exec).
Segurança + pergunta + lista de permissões são armazenadas localmente no Mac em:

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

- Entradas de `allowlist` são padrões glob para caminhos resolvidos de binários, ou nomes simples de comando para comandos invocados pelo PATH.
- Texto bruto de comando shell que contenha sintaxe de controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência na lista de permissões e exige aprovação explícita (ou inclusão do binário do shell na lista de permissões).
- Escolher “Always Allow” no prompt adiciona esse comando à lista de permissões.
- Substituições de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e depois mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de ambiente com escopo da solicitação são reduzidas a uma pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez de caminhos do wrapper. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões é persistida automaticamente.

## Deep links

O app registra o esquema de URL `openclaw://` para ações locais.

### `openclaw://agent`

Aciona uma solicitação `agent` do Gateway.
__OC_I18N_900004__
Parâmetros de consulta:

- `message` (obrigatório)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (opcional, chave do modo não assistido)

Segurança:

- Sem `key`, o app pede confirmação.
- Sem `key`, o app impõe um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é não assistida (destinada a automações pessoais).

## Fluxo de onboarding (típico)

1. Instale e abra o **OpenClaw.app**.
2. Conclua o checklist de permissões (prompts de TCC).
3. Verifique se o modo **Local** está ativo e se o Gateway está em execução.
4. Instale a CLI se quiser acesso pelo terminal.

## Posicionamento do diretório de estado (macOS)

Evite colocar o diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas por nuvem.
Caminhos com sincronização podem adicionar latência e ocasionalmente causar disputas de bloqueio/sincronização de arquivos para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele emitirá um aviso e recomendará mover de volta para um caminho local.

## Workflow de build e desenvolvimento (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade com o gateway (CLI do macOS)

Use a CLI de depuração para exercitar a mesma lógica de handshake e descoberta de WebSocket do Gateway
que o app do macOS usa, sem abrir o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: substitui a configuração
- `--mode <local|remote>`: resolve a partir da configuração (padrão: configuração ou local)
- `--probe`: força uma nova sondagem de integridade
- `--timeout <ms>`: timeout da solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: inclui gateways que seriam filtrados como “locais”
- `--timeout <ms>`: janela total de descoberta (padrão: `2000`)
- `--json`: saída estruturada para comparação

Dica: compare com `openclaw gateway discover --json` para ver se o
pipeline de descoberta do app do macOS (`local.` mais o domínio wide-area configurado, com
fallbacks de wide-area e Tailscale Serve) difere do
pipeline baseado em `dns-sd` da CLI Node.

## Infraestrutura de conexão remota (túneis SSH)

Quando o app do macOS é executado em modo **Remoto**, ele abre um túnel SSH para que componentes locais de UI
possam se comunicar com um Gateway remoto como se ele estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de integridade, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel íntegro existente
  ou o reinicia, se necessário.
- **Formato SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o IP do nó
  como `127.0.0.1`. Use transporte **Direct (ws/wss)** se quiser que o IP real do cliente
  apareça (consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote)).

Para etapas de configuração, consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote). Para detalhes
do protocolo, consulte [protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
