---
read_when:
    - Você executa o OpenClaw com Docker com frequência e quer comandos mais curtos para o dia a dia
    - Você quer uma camada auxiliar para painel, registros, configuração de token e fluxos de pareamento
summary: Auxiliares de shell do ClawDock para instalações do OpenClaw baseadas em Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T05:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock é uma pequena camada auxiliar de shell para instalações do OpenClaw baseadas em Docker.

Ela fornece comandos curtos como `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` em vez de invocações mais longas de `docker compose ...`.

Se você ainda não configurou o Docker, comece por [Docker](/pt-BR/install/docker).

## Instalação

Use o caminho auxiliar canônico:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se você instalou o ClawDock anteriormente a partir de `scripts/shell-helpers/clawdock-helpers.sh`, reinstale a partir do novo caminho `scripts/clawdock/clawdock-helpers.sh`. O caminho antigo no GitHub bruto foi removido.

## O que você obtém

### Operações básicas

| Comando            | Descrição                      |
| ------------------ | ------------------------------ |
| `clawdock-start`   | Iniciar o Gateway              |
| `clawdock-stop`    | Parar o Gateway                |
| `clawdock-restart` | Reiniciar o Gateway            |
| `clawdock-status`  | Verificar o status do contêiner |
| `clawdock-logs`    | Acompanhar os logs do Gateway  |

### Acesso ao contêiner

| Comando                   | Descrição                                      |
| ------------------------- | ---------------------------------------------- |
| `clawdock-shell`          | Abrir um shell dentro do contêiner do Gateway  |
| `clawdock-cli <command>`  | Executar comandos da CLI do OpenClaw no Docker |
| `clawdock-exec <command>` | Executar um comando arbitrário no contêiner    |

### Interface Web e pareamento

| Comando                 | Descrição                              |
| ----------------------- | -------------------------------------- |
| `clawdock-dashboard`    | Abrir a URL da interface de controle   |
| `clawdock-devices`      | Listar pareamentos de dispositivos pendentes |
| `clawdock-approve <id>` | Aprovar uma solicitação de pareamento  |

### Configuração e manutenção

| Comando              | Descrição                                           |
| -------------------- | --------------------------------------------------- |
| `clawdock-fix-token` | Configurar o token do Gateway dentro do contêiner   |
| `clawdock-update`    | Baixar, reconstruir e reiniciar                     |
| `clawdock-rebuild`   | Reconstruir apenas a imagem Docker                  |
| `clawdock-clean`     | Remover contêineres e volumes                       |

### Utilitários

| Comando                | Descrição                                           |
| ---------------------- | --------------------------------------------------- |
| `clawdock-health`      | Executar uma verificação de integridade do Gateway  |
| `clawdock-token`       | Imprimir o token do Gateway                         |
| `clawdock-cd`          | Ir para o diretório do projeto OpenClaw             |
| `clawdock-config`      | Abrir `~/.openclaw`                                 |
| `clawdock-show-config` | Imprimir arquivos de configuração com valores ocultados |
| `clawdock-workspace`   | Abrir o diretório do workspace                      |

## Fluxo da primeira vez

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se o navegador disser que o pareamento é obrigatório:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuração e segredos

O ClawDock funciona com a mesma divisão de configuração do Docker descrita em [Docker](/pt-BR/install/docker):

- `<project>/.env` para valores específicos do Docker, como nome da imagem, portas e o token do Gateway
- `~/.openclaw/.env` para chaves de provedores e tokens de bots baseados em env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` para autenticação OAuth/API-key de provedores armazenada
- `~/.openclaw/openclaw.json` para configuração de comportamento

Use `clawdock-show-config` quando quiser inspecionar rapidamente os arquivos `.env` e `openclaw.json`. Ele oculta valores de `.env` na saída impressa.

## Relacionado

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="docker">
    Instalação canônica do Docker para OpenClaw.
  </Card>
  <Card title="Runtime de VM do Docker" href="/pt-BR/install/docker-vm-runtime" icon="cube">
    Runtime de VM gerenciado pelo Docker para isolamento reforçado.
  </Card>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="arrow-up-right-from-square">
    Atualização do pacote OpenClaw e dos serviços gerenciados.
  </Card>
</CardGroup>
