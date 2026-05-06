---
read_when:
    - Implementando recursos do aplicativo para macOS
    - Alterando o ciclo de vida do Gateway ou a ponte de Node no macOS
summary: App complementar do OpenClaw para macOS (barra de menus + broker de Gateway)
title: app para macOS
x-i18n:
    generated_at: "2026-05-06T09:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro da barra de menus** do OpenClaw. Ele é responsável por permissões,
gerencia/anexa ao Gateway localmente (launchd ou manual) e expõe recursos do macOS
ao agente como um node.

## O que ele faz

- Mostra notificações nativas e status na barra de menus.
- É responsável pelos prompts de TCC (Notificações, Acessibilidade, Gravação de Tela, Microfone,
  Reconhecimento de Fala, Automação/AppleScript).
- Executa ou se conecta ao Gateway (local ou remoto).
- Expõe ferramentas exclusivas do macOS (Canvas, Câmera, Gravação de Tela, `system.run`).
- Inicia o serviço local de host de node no modo **remoto** (launchd) e o interrompe no modo **local**.
- Opcionalmente hospeda o **PeekabooBridge** para automação de UI.
- Instala a CLI global (`openclaw`) sob solicitação via npm, pnpm ou bun (o app prefere npm, depois pnpm, depois bun; Node continua sendo o runtime recomendado para o Gateway).

## Modo local vs remoto

- **Local** (padrão): o app se anexa a um Gateway local em execução, se houver;
  caso contrário, habilita o serviço launchd via `openclaw gateway install`.
- **Remoto**: o app se conecta a um Gateway por SSH/Tailscale e nunca inicia
  um processo local.
  O app inicia o **serviço local de host de node** para que o Gateway remoto possa alcançar este Mac.
  O app não cria o Gateway como um processo filho.
  A descoberta de Gateway agora prefere nomes Tailscale MagicDNS em vez de IPs tailnet brutos,
  para que o app do Mac se recupere com mais confiabilidade quando os IPs tailnet mudam.

## Controle do launchd

O app gerencia um LaunchAgent por usuário rotulado como `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` ainda é descarregado).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

Se o LaunchAgent não estiver instalado, habilite-o pelo app ou execute
`openclaw gateway install`.

## Capacidades do Node (mac)

O app para macOS se apresenta como um node. Comandos comuns:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Câmera: `camera.snap`, `camera.clip`
- Tela: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

O node relata um mapa `permissions` para que os agentes possam decidir o que é permitido.

Serviço de node + IPC do app:

- Quando o serviço headless de host de node está em execução (modo remoto), ele se conecta ao Gateway WS como um node.
- `system.run` é executado no app para macOS (contexto de UI/TCC) por meio de um soquete Unix local; prompts + saída permanecem no app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprovações de execução (system.run)

`system.run` é controlado por **Aprovações de execução** no app para macOS (Ajustes → Aprovações de execução).
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

- Entradas de `allowlist` são padrões glob para caminhos binários resolvidos, ou nomes de comando simples para comandos invocados via PATH.
- Texto bruto de comando shell que contém sintaxe de controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como uma ausência na lista de permissões e exige aprovação explícita (ou permitir o binário do shell).
- Escolher "Sempre permitir" no prompt adiciona esse comando à lista de permissões.
- Sobrescritas de ambiente de `system.run` são filtradas (remove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e então mescladas com o ambiente do app.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de ambiente com escopo de solicitação são reduzidas a uma pequena lista explícita de permissões (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de sempre permitir no modo de lista de permissões, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez dos caminhos do wrapper. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões será persistida automaticamente.

## Links profundos

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
- `key` (chave opcional para modo autônomo)

Segurança:

- Sem `key`, o app solicita confirmação.
- Sem `key`, o app aplica um limite curto de mensagem para o prompt de confirmação e ignora `deliver` / `to` / `channel`.
- Com uma `key` válida, a execução é autônoma (destinada a automações pessoais).

## Fluxo de integração (típico)

1. Instale e inicie o **OpenClaw.app**.
2. Conclua a lista de verificação de permissões (prompts de TCC).
3. Garanta que o modo **Local** esteja ativo e que o Gateway esteja em execução.
4. Instale a CLI se quiser acesso pelo terminal.

## Posicionamento do diretório de estado (macOS)

Evite colocar o diretório de estado do OpenClaw no iCloud ou em outras pastas sincronizadas pela nuvem.
Caminhos com sincronização podem adicionar latência e, ocasionalmente, causar disputas de bloqueio/sincronização de arquivos para
sessões e credenciais.

Prefira um caminho de estado local não sincronizado, como:
__OC_I18N_900005__
Se `openclaw doctor` detectar estado em:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ele avisará e recomendará voltar para um caminho local.

## Workflow de build e dev (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empacotar app: `scripts/package-mac-app.sh`

## Depurar conectividade do Gateway (CLI macOS)

Use a CLI de depuração para exercitar o mesmo handshake WebSocket e a mesma lógica de descoberta
do Gateway que o app para macOS usa, sem iniciar o app.
__OC_I18N_900006__
Opções de conexão:

- `--url <ws://host:port>`: substituir a configuração
- `--mode <local|remote>`: resolver a partir da configuração (padrão: configuração ou local)
- `--probe`: forçar uma nova sondagem de integridade
- `--timeout <ms>`: tempo limite da solicitação (padrão: `15000`)
- `--json`: saída estruturada para comparação

Opções de descoberta:

- `--include-local`: incluir gateways que seriam filtrados como "locais"
- `--timeout <ms>`: janela geral de descoberta (padrão: `2000`)
- `--json`: saída estruturada para comparação

<Tip>
Compare com `openclaw gateway discover --json` para ver se o pipeline de descoberta do app para macOS (`local.` mais o domínio de longa distância configurado, com fallbacks de longa distância e Tailscale Serve) difere da descoberta baseada em `dns-sd` da CLI Node.
</Tip>

## Encanamento de conexão remota (túneis SSH)

Quando o app para macOS é executado no modo **Remoto**, ele abre um túnel SSH para que componentes locais de UI
possam falar com um Gateway remoto como se ele estivesse em localhost.

### Túnel de controle (porta WebSocket do Gateway)

- **Finalidade:** verificações de integridade, status, Web Chat, configuração e outras chamadas do plano de controle.
- **Porta local:** a porta do Gateway (padrão `18789`), sempre estável.
- **Porta remota:** a mesma porta do Gateway no host remoto.
- **Comportamento:** sem porta local aleatória; o app reutiliza um túnel íntegro existente
  ou o reinicia, se necessário.
- **Formato SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` com BatchMode +
  ExitOnForwardFailure + opções de keepalive.
- **Relato de IP:** o túnel SSH usa loopback, então o gateway verá o IP do node
  como `127.0.0.1`. Use o transporte **Direto (ws/wss)** se quiser que o IP real do cliente
  apareça (consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote)).

Para etapas de configuração, consulte [acesso remoto no macOS](/pt-BR/platforms/mac/remote). Para detalhes do protocolo,
consulte [protocolo do Gateway](/pt-BR/gateway/protocol).

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Gateway (macOS)](/pt-BR/platforms/mac/bundled-gateway)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
- [Canvas](/pt-BR/platforms/mac/canvas)
