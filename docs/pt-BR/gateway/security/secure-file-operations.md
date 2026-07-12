---
read_when:
    - Alteração do acesso a arquivos, da extração de arquivos compactados, do armazenamento do espaço de trabalho ou dos auxiliares de sistema de arquivos de plugins
summary: Como o OpenClaw lida com o acesso seguro a arquivos locais e por que o auxiliar opcional fs-safe para Python vem desativado por padrão
title: Operações seguras com arquivos
x-i18n:
    generated_at: "2026-07-11T23:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operações locais de arquivos sensíveis à segurança: leituras/gravações limitadas à raiz, substituição atômica, extração de arquivos compactados, espaços de trabalho temporários, estado em JSON e tratamento de arquivos de segredos.

É uma **proteção de biblioteca** para código confiável do OpenClaw que recebe nomes de caminhos não confiáveis, não uma sandbox. As permissões do sistema de arquivos do host, os usuários do sistema operacional, os contêineres e a política do agente/das ferramentas ainda definem o verdadeiro raio de impacto.

## Padrão: sem auxiliar Python

O OpenClaw define o auxiliar Python POSIX do fs-safe como **desativado** por padrão:

- o Gateway não deve iniciar um processo auxiliar persistente em Python, a menos que um operador opte por isso;
- a maioria das instalações não precisa da proteção adicional contra alterações em diretórios-pai;
- desativar o Python mantém o comportamento em tempo de execução previsível em ambientes desktop, Docker, CI e de aplicativos empacotados.

O OpenClaw altera apenas o _padrão_. Uma configuração explícita sempre prevalece:

```bash
# Comportamento padrão do OpenClaw: alternativas do fs-safe somente com Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Ativa o auxiliar quando disponível, recorrendo à alternativa se estiver indisponível.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Falha de forma segura se o auxiliar não puder ser iniciado.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Caminho explícito opcional para o interpretador.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Os nomes genéricos de variáveis de ambiente do fs-safe também funcionam: `FS_SAFE_PYTHON_MODE` e `FS_SAFE_PYTHON`.

Use `require` (não `auto`) quando o auxiliar fizer parte da sua postura de segurança; `auto` recorre silenciosamente ao comportamento somente com Node se o auxiliar não puder ser iniciado.

## O que permanece protegido sem Python

Com o auxiliar desativado, o OpenClaw ainda conta com as proteções do fs-safe somente com Node:

- rejeita escapes de caminhos relativos (`..`), caminhos absolutos e separadores de caminho onde apenas nomes simples são permitidos;
- resolve operações por meio de um identificador de raiz confiável, em vez de verificações improvisadas com `path.resolve(...).startsWith(...)`;
- recusa padrões de links simbólicos e links físicos em APIs que exigem essa política;
- abre arquivos com verificações de identidade quando a API retorna ou consome o conteúdo deles;
- grava arquivos de estado/configuração usando um arquivo temporário irmão e renomeação atômica;
- impõe limites de bytes para leituras e extração de arquivos compactados;
- aplica modos de arquivo privados a segredos e arquivos de estado quando exigido pela API.

Isso abrange o modelo de ameaças normal do OpenClaw: código confiável do Gateway processando entradas de caminho não confiáveis provenientes de modelos/plugins/canais dentro dos limites de um único operador confiável.

## O que o Python acrescenta

Em POSIX, o auxiliar opcional mantém um processo Python persistente e usa operações do sistema de arquivos relativas a descritores de arquivo para alterações em diretórios-pai: renomear, remover, criar diretório, consultar/listar e alguns caminhos de gravação.

Isso reduz as janelas de condição de corrida sob o mesmo UID em que outro processo troca um diretório-pai entre a validação e a alteração — uma defesa em profundidade em hosts nos quais processos locais não confiáveis podem modificar os mesmos diretórios em que o OpenClaw opera.

Se sua implantação apresentar esse risco e a existência do Python for garantida, defina:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Orientações para plugins e o núcleo

- O acesso a arquivos destinado a plugins deve passar pelos auxiliares de `openclaw/plugin-sdk/*`, e não pelo `fs` bruto, quando um caminho vier de uma mensagem, saída do modelo, configuração ou entrada de plugin.
- O código do núcleo deve usar os wrappers do fs-safe em `src/infra/*` para que a política de processo do OpenClaw seja aplicada de forma consistente.
- A extração de arquivos compactados deve usar os auxiliares de arquivos compactados do fs-safe com limites explícitos de tamanho, quantidade de entradas, links e destino.
- Segredos devem usar os auxiliares de segredos do OpenClaw ou os auxiliares de segredos/estado privado do fs-safe; não implemente manualmente verificações de modo em torno de `fs.writeFile`.
- Para isolamento contra usuários locais hostis, não dependa apenas do fs-safe. Execute Gateways separados sob usuários ou hosts distintos do sistema operacional, ou use sandboxing.

Relacionado: [Segurança](/pt-BR/gateway/security), [Sandboxing](/pt-BR/gateway/sandboxing), [Aprovações de execução](/pt-BR/tools/exec-approvals), [Segredos](/pt-BR/gateway/secrets).
