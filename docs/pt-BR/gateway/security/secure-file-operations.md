---
read_when:
    - Alteração do acesso a arquivos, da extração de arquivos compactados, do armazenamento do workspace ou dos auxiliares de sistema de arquivos de plugins
summary: Como o OpenClaw gerencia com segurança o acesso a arquivos locais e por que o auxiliar opcional fs-safe para Python fica desativado por padrão
title: Operações seguras com arquivos
x-i18n:
    generated_at: "2026-07-12T15:15:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operações locais de arquivos sensíveis à segurança: leituras/gravações restritas à raiz, substituição atômica, extração de arquivos compactados, espaços de trabalho temporários, estado em JSON e manipulação de arquivos de segredos.

É uma **proteção de biblioteca** para código confiável do OpenClaw que recebe nomes de caminhos não confiáveis, não um sandbox. As permissões do sistema de arquivos do host, os usuários do sistema operacional, os contêineres e a política de agentes/ferramentas ainda definem o verdadeiro raio de impacto.

## Padrão: sem auxiliar Python

Por padrão, o OpenClaw define o auxiliar Python POSIX do fs-safe como **desativado**:

- o Gateway não deve iniciar um processo auxiliar Python persistente, a menos que um operador opte por isso;
- a maioria das instalações não precisa da proteção adicional contra mutações de diretórios pai;
- desativar o Python mantém o comportamento do runtime previsível em ambientes de desktop, Docker, CI e aplicativos empacotados.

O OpenClaw altera apenas o _padrão_. Uma configuração explícita sempre prevalece:

```bash
# Comportamento padrão do OpenClaw: fallbacks do fs-safe apenas com Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Ativa o auxiliar quando disponível, usando o fallback se estiver indisponível.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Falha de forma segura se o auxiliar não puder ser iniciado.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Caminho explícito opcional do interpretador.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Os nomes genéricos de variáveis de ambiente do fs-safe também funcionam: `FS_SAFE_PYTHON_MODE` e `FS_SAFE_PYTHON`.

Use `require` (não `auto`) quando o auxiliar fizer parte da sua postura de segurança; `auto` usa silenciosamente o comportamento somente com Node como fallback se o auxiliar não puder ser iniciado.

## O que permanece protegido sem Python

Com o auxiliar desativado, o OpenClaw ainda conta com as proteções do fs-safe somente com Node:

- rejeita escapes de caminhos relativos (`..`), caminhos absolutos e separadores de caminho onde somente nomes simples são permitidos;
- resolve operações por meio de um descritor de raiz confiável, em vez de verificações improvisadas com `path.resolve(...).startsWith(...)`;
- recusa padrões de links simbólicos e links físicos em APIs que exigem essa política;
- abre arquivos com verificações de identidade quando a API retorna ou consome o conteúdo deles;
- grava arquivos de estado/configuração usando um arquivo temporário irmão seguido de renomeação atômica;
- impõe limites de bytes para leituras e extração de arquivos compactados;
- aplica modos de arquivo privados a segredos e arquivos de estado quando a API os exige.

Isso abrange o modelo de ameaças normal do OpenClaw: código confiável do Gateway manipulando entradas de caminho não confiáveis provenientes de modelos/plugins/canais dentro de um único limite de operador confiável.

## O que o Python acrescenta

No POSIX, o auxiliar opcional mantém um único processo Python persistente e usa operações de sistema de arquivos relativas a descritores de arquivo para mutações de diretórios pai: renomear, remover, criar diretórios, consultar/listar e alguns caminhos de gravação.

Isso reduz as janelas de condição de corrida com o mesmo UID nas quais outro processo troca um diretório pai entre a validação e a mutação — uma defesa em profundidade em hosts onde processos locais não confiáveis podem modificar os mesmos diretórios nos quais o OpenClaw opera.

Se sua implantação tiver esse risco e houver garantia de que o Python existe, defina:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Orientações para plugins e núcleo

- O acesso a arquivos voltado a plugins deve passar pelos auxiliares `openclaw/plugin-sdk/*`, não pelo `fs` bruto, quando um caminho vier de uma mensagem, saída de modelo, configuração ou entrada de plugin.
- O código do núcleo deve usar os wrappers do fs-safe em `src/infra/*` para que a política de processo do OpenClaw seja aplicada de forma consistente.
- A extração de arquivos compactados deve usar os auxiliares de arquivos compactados do fs-safe com limites explícitos de tamanho, número de entradas, links e destino.
- Segredos devem usar os auxiliares de segredos do OpenClaw ou os auxiliares de segredos/estado privado do fs-safe; não implemente manualmente verificações de modo em torno de `fs.writeFile`.
- Para isolamento contra usuários locais hostis, não dependa apenas do fs-safe. Execute Gateways separados sob usuários ou hosts distintos do sistema operacional, ou use sandboxing.

Relacionado: [Segurança](/pt-BR/gateway/security), [Sandboxing](/pt-BR/gateway/sandboxing), [Aprovações de execução](/pt-BR/tools/exec-approvals), [Segredos](/pt-BR/gateway/secrets).
