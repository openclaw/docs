---
read_when:
    - Você executa o OpenClaw com Docker com frequência e quer comandos mais curtos para o dia a dia
    - Você quer uma camada auxiliar para o painel, os logs, a configuração de tokens e os fluxos de pareamento
summary: Auxiliares de shell do ClawDock para instalações do OpenClaw baseadas em Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T15:17:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock é uma pequena camada de utilitários de shell para instalações do OpenClaw baseadas em Docker.

Ela oferece comandos curtos como `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` em vez de invocações mais longas de `docker compose ...`.

Se você ainda não configurou o Docker, comece por [Docker](/pt-BR/install/docker).

## Instalação

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou anteriormente o ClawDock por meio de `scripts/shell-helpers/clawdock-helpers.sh`, reinstale usando o caminho atual `scripts/clawdock/clawdock-helpers.sh`; o caminho antigo de conteúdo bruto do GitHub foi removido.

Os utilitários detectam automaticamente seu checkout do OpenClaw no primeiro uso (verificando caminhos comuns como `~/openclaw` e `~/projects/openclaw`) e armazenam o resultado em cache em `~/.clawdock/config`. Defina `CLAWDOCK_DIR` manualmente se seu checkout estiver em outro local.

## O que está incluído

### Operações básicas

| Comando            | Descrição                       |
| ------------------ | ------------------------------- |
| `clawdock-start`   | Inicia o Gateway                |
| `clawdock-stop`    | Interrompe o Gateway            |
| `clawdock-restart` | Reinicia o Gateway              |
| `clawdock-status`  | Verifica o status do contêiner  |
| `clawdock-logs`    | Acompanha os logs do Gateway    |

### Acesso ao contêiner

| Comando                   | Descrição                                             |
| ------------------------- | ----------------------------------------------------- |
| `clawdock-shell`          | Abre um shell dentro do contêiner do Gateway          |
| `clawdock-cli <command>`  | Executa comandos da CLI do OpenClaw no Docker         |
| `clawdock-exec <command>` | Executa um comando arbitrário no contêiner             |

### Interface web e emparelhamento

| Comando                 | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `clawdock-dashboard`    | Abre a URL da interface de controle            |
| `clawdock-devices`      | Lista emparelhamentos de dispositivos pendentes |
| `clawdock-approve <id>` | Aprova uma solicitação de emparelhamento       |

### Configuração e manutenção

| Comando              | Descrição                                                    |
| -------------------- | ------------------------------------------------------------ |
| `clawdock-fix-token` | Grava o token do Gateway na configuração do contêiner        |
| `clawdock-update`    | Baixa atualizações, recompila e reinicia                      |
| `clawdock-rebuild`   | Recompila somente a imagem do Docker                          |
| `clawdock-clean`     | Remove contêineres e volumes                                  |

### Utilitários

| Comando                | Descrição                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `clawdock-health`      | Executa uma verificação de integridade do Gateway           |
| `clawdock-token`       | Exibe o token do Gateway                                    |
| `clawdock-cd`          | Acessa o diretório do projeto OpenClaw                      |
| `clawdock-config`      | Abre `~/.openclaw`                                          |
| `clawdock-show-config` | Exibe arquivos de configuração com os valores ocultados     |
| `clawdock-workspace`   | Abre o diretório do espaço de trabalho                      |
| `clawdock-help`        | Lista todos os comandos do ClawDock                         |

## Fluxo do primeiro uso

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se o navegador informar que o emparelhamento é necessário:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuração e segredos

O ClawDock lê dois arquivos `.env` separados, seguindo a divisão descrita em [Docker](/pt-BR/install/docker):

- O `.env` do projeto, ao lado de `docker-compose.yml`: valores específicos do Docker, como o nome da imagem, as portas e `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` lê o token desse arquivo.
- `~/.openclaw/.env` (montado no contêiner): segredos fornecidos por variáveis de ambiente que o próprio OpenClaw gerencia, junto com `openclaw.json` e `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copia o token do `.env` do projeto para os valores de configuração `gateway.remote.token` e `gateway.auth.token` do contêiner e reinicia o Gateway.

Use `clawdock-show-config` para inspecionar rapidamente `openclaw.json` e os dois arquivos `.env`; ele oculta os valores de `.env` na saída exibida.

## Relacionados

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Instalação canônica do OpenClaw com Docker.
  </Card>
  <Card title="Runtime de VM do Docker" href="/pt-BR/install/docker-vm-runtime" icon="cube">
    Runtime de VM gerenciado pelo Docker para isolamento reforçado.
  </Card>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização do pacote OpenClaw e dos serviços gerenciados.
  </Card>
</CardGroup>
