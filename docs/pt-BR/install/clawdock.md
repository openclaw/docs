---
read_when:
    - Você executa o OpenClaw com Docker com frequência e quer comandos diários mais curtos
    - Você quer uma camada de helpers para dashboard, logs, configuração de token e fluxos de pairing
summary: Helpers de shell do ClawDock para instalações do OpenClaw baseadas em Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T05:56:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

O ClawDock é uma pequena camada de helpers de shell para instalações do OpenClaw baseadas em Docker.

Ele oferece comandos curtos como `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` em vez de invocações mais longas de `docker compose ...`.

Se você ainda não configurou o Docker, comece por [Docker](/pt-BR/install/docker).

## Instalação

Use o caminho canônico do helper:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock anteriormente a partir de `scripts/shell-helpers/clawdock-helpers.sh`, reinstale usando o novo caminho `scripts/clawdock/clawdock-helpers.sh`. O antigo caminho raw do GitHub foi removido.

## O que você recebe

### Operações básicas

| Comando            | Descrição                  |
| ------------------ | -------------------------- |
| `clawdock-start`   | Iniciar o gateway          |
| `clawdock-stop`    | Parar o gateway            |
| `clawdock-restart` | Reiniciar o gateway        |
| `clawdock-status`  | Verificar status do container |
| `clawdock-logs`    | Acompanhar logs do gateway |

### Acesso ao container

| Comando                  | Descrição                                      |
| ------------------------ | ---------------------------------------------- |
| `clawdock-shell`         | Abrir um shell dentro do container do gateway  |
| `clawdock-cli <command>` | Executar comandos da CLI do OpenClaw no Docker |
| `clawdock-exec <command>` | Executar um comando arbitrário no container   |

### UI web e pairing

| Comando                | Descrição                        |
| ---------------------- | -------------------------------- |
| `clawdock-dashboard`   | Abrir a URL da UI de Controle    |
| `clawdock-devices`     | Listar pairings de dispositivo pendentes |
| `clawdock-approve <id>` | Aprovar uma solicitação de pairing |

### Configuração e manutenção

| Comando             | Descrição                                         |
| ------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Configurar o token do gateway dentro do container |
| `clawdock-update`   | Fazer pull, rebuild e reiniciar                   |
| `clawdock-rebuild`  | Rebuild apenas da imagem Docker                   |
| `clawdock-clean`    | Remover containers e volumes                      |

### Utilitários

| Comando               | Descrição                                  |
| --------------------- | ------------------------------------------ |
| `clawdock-health`     | Executar uma verificação de integridade do gateway |
| `clawdock-token`      | Imprimir o token do gateway                |
| `clawdock-cd`         | Ir para o diretório do projeto OpenClaw    |
| `clawdock-config`     | Abrir `~/.openclaw`                        |
| `clawdock-show-config` | Imprimir arquivos de configuração com valores redigidos |
| `clawdock-workspace`  | Abrir o diretório do workspace             |

## Fluxo inicial

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se o navegador disser que pairing é necessário:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuração e segredos

O ClawDock funciona com a mesma divisão de configuração do Docker descrita em [Docker](/pt-BR/install/docker):

- `<project>/.env` para valores específicos do Docker, como nome da imagem, portas e token do gateway
- `~/.openclaw/.env` para chaves de provedor e tokens de bot baseados em env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` para autenticação armazenada de OAuth/chave de API do provedor
- `~/.openclaw/openclaw.json` para configuração de comportamento

Use `clawdock-show-config` quando quiser inspecionar rapidamente os arquivos `.env` e `openclaw.json`. Ele redige valores de `.env` na saída impressa.

## Páginas relacionadas

- [Docker](/pt-BR/install/docker)
- [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime)
- [Atualizando](/pt-BR/install/updating)
