---
read_when:
    - Alteração do acesso a arquivos, extração de arquivos compactados, armazenamento do espaço de trabalho ou auxiliares do sistema de arquivos de Plugin
summary: Como o OpenClaw lida com o acesso seguro a arquivos locais e por que o auxiliar Python opcional fs-safe fica desativado por padrão
title: Operações seguras com arquivos
x-i18n:
    generated_at: "2026-05-06T05:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operações locais de arquivo sensíveis à segurança: leituras/gravações limitadas à raiz, substituição atômica, extração de arquivos compactados, workspaces temporários, estado JSON e tratamento de arquivos de segredo.

O objetivo é uma **barreira de proteção de biblioteca** consistente para código OpenClaw confiável que recebe nomes de caminho não confiáveis. Ela não é uma sandbox. Permissões do sistema de arquivos do host, usuários do sistema operacional, contêineres e a política de agente/ferramenta ainda definem o raio de impacto real.

## Padrão: sem auxiliar Python

OpenClaw deixa o auxiliar POSIX Python do fs-safe **desativado** por padrão.

Por quê:

- o Gateway não deve iniciar um sidecar Python persistente, a menos que um operador tenha optado por isso;
- muitas instalações não precisam do reforço adicional contra mutação de diretório pai;
- desabilitar Python mantém o comportamento de pacote/runtime mais previsível em ambientes de desktop, Docker, CI e aplicativo empacotado.

OpenClaw altera apenas o padrão. Se você definir explicitamente um modo, o fs-safe o respeita:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Os nomes genéricos do fs-safe também funcionam: `FS_SAFE_PYTHON_MODE` e `FS_SAFE_PYTHON`.

## O que continua protegido sem Python

Com o auxiliar desativado, OpenClaw ainda usa os caminhos Node do fs-safe para:

- rejeitar escapes de caminho relativo como `..`, caminhos absolutos e separadores de caminho onde apenas nomes são permitidos;
- resolver operações por meio de um identificador de raiz confiável em vez de verificações ad hoc `path.resolve(...).startsWith(...)`;
- recusar padrões de symlink e hardlink em APIs que exigem essa política;
- abrir arquivos com verificações de identidade quando a API retorna ou consome conteúdo de arquivo;
- gravações atômicas em temporário irmão para arquivos de estado/configuração;
- limites de bytes para leituras e extração de arquivos compactados;
- modos privados para segredos e arquivos de estado quando a API os exige.

Essas proteções cobrem o modelo de ameaça normal do OpenClaw: código confiável do Gateway tratando entrada de caminho não confiável de modelo/plugin/canal dentro de um único limite de operador confiável.

## O que Python adiciona

No POSIX, o auxiliar opcional do fs-safe mantém um processo Python persistente e usa operações de sistema de arquivos relativas a fd para mutações de diretório pai, como renomear, remover, criar diretório, stat/list e alguns caminhos de gravação.

Isso reduz janelas de corrida de mesmo UID em que outro processo pode trocar um diretório pai entre a validação e a mutação. É defesa em profundidade para hosts onde processos locais não confiáveis podem modificar os mesmos diretórios em que o OpenClaw está operando.

Se sua implantação tem esse risco e há garantia de que Python existe, use:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Use `require` em vez de `auto` quando o auxiliar fizer parte da sua postura de segurança; `auto` intencionalmente recorre ao comportamento apenas Node se o auxiliar estiver indisponível.

## Orientação para Plugin e core

- O acesso a arquivos voltado a plugins deve passar por auxiliares `openclaw/plugin-sdk/*`, não por `fs` bruto, quando um caminho vem de uma mensagem, saída de modelo, configuração ou entrada de plugin.
- Código core deve usar os wrappers locais do fs-safe em `src/infra/*` para que a política de processo do OpenClaw seja aplicada de forma consistente.
- A extração de arquivos compactados deve usar os auxiliares de arquivo compactado do fs-safe com limites explícitos de tamanho, contagem de entradas, links e destino.
- Segredos devem usar auxiliares de segredo do OpenClaw ou auxiliares de segredo/estado privado do fs-safe; não implemente manualmente verificações de modo em torno de `fs.writeFile`.
- Se você precisa de isolamento contra usuários locais hostis, não dependa apenas do fs-safe. Execute Gateways separados sob usuários/hosts separados do sistema operacional ou use sandboxing.

Relacionado: [Segurança](/pt-BR/gateway/security), [Sandboxing](/pt-BR/gateway/sandboxing), [Aprovações de execução](/pt-BR/tools/exec-approvals), [Segredos](/pt-BR/gateway/secrets).
