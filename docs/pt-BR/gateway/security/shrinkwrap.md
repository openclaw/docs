---
read_when:
    - Você quer saber o que o shrinkwrap do npm significa em uma versão do OpenClaw
    - Você está revisando arquivos de bloqueio de pacotes, alterações em dependências ou riscos à cadeia de suprimentos
    - Você está validando pacotes npm raiz ou de plugins antes da publicação
summary: Explicação em linguagem simples e técnica sobre o shrinkwrap do npm nas versões do OpenClaw
title: shrinkwrap do npm
x-i18n:
    generated_at: "2026-07-12T00:00:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Os checkouts do código-fonte do OpenClaw usam `pnpm-lock.yaml`. Os pacotes npm publicados do OpenClaw usam `npm-shrinkwrap.json`, o arquivo de bloqueio de dependências publicável do npm, para que as instalações de pacotes usem o grafo de dependências revisado durante o lançamento.

## Por que isso é importante

O shrinkwrap é um registro da árvore de dependências distribuída com um pacote npm: ele informa ao npm quais versões transitivas exatas devem ser instaladas.

| Arquivo               | Onde é relevante                 | O que significa                         |
| --------------------- | -------------------------------- | --------------------------------------- |
| `pnpm-lock.yaml`      | Checkout do código-fonte do OpenClaw | Grafo de dependências dos mantenedores |
| `npm-shrinkwrap.json` | Pacote npm publicado             | Grafo de instalação do npm para usuários |
| `package-lock.json`   | Aplicativos npm locais           | Não é o contrato de publicação do OpenClaw |

Para os lançamentos do OpenClaw, isso significa que:

- o pacote publicado não solicita que o npm crie um novo grafo de dependências no momento da instalação;
- as alterações de dependências podem ser revisadas porque são incluídas em um diff do arquivo de bloqueio;
- a validação do lançamento testa o mesmo grafo que os usuários instalarão;
- surpresas relacionadas ao tamanho do pacote ou a dependências nativas aparecem antes da publicação.

O shrinkwrap não é um ambiente isolado. Ele não torna uma dependência segura por si só e não substitui o isolamento do host, o `openclaw security audit`, a proveniência dos pacotes nem os testes rápidos de instalação.

O OpenClaw é um Gateway, host de plugins, roteador de modelos e ambiente de execução de agentes; portanto, uma instalação padrão afeta o tempo de inicialização, o uso de disco, os downloads de pacotes nativos e a exposição à cadeia de suprimentos. O shrinkwrap fornece à revisão do lançamento um limite estável: os revisores veem as alterações nas dependências transitivas, os validadores rejeitam divergências inesperadas no arquivo de bloqueio e os pacotes de plugins carregam seu próprio grafo de dependências bloqueado, em vez de depender do pacote raiz.

## Geração e verificação

O pacote npm raiz `openclaw`, os pacotes npm de plugins pertencentes ao OpenClaw (por exemplo, `@openclaw/discord`) e os pacotes publicáveis do workspace, como [`@openclaw/ai`](/reference/openclaw-ai), incluem `npm-shrinkwrap.json` quando são publicados. As dependências do workspace são omitidas do shrinkwrap raiz porque são publicadas junto com o pacote raiz; em vez disso, cada pacote publicável do workspace fixa sua própria árvore transitiva. Pacotes de plugins adequados também podem ser publicados com `bundledDependencies` explícitas, incluindo seus arquivos de dependências de execução no tarball do plugin, em vez de depender apenas da resolução durante a instalação.

```bash
# Todos os pacotes gerenciados por shrinkwrap (raiz + plugins publicáveis)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Apenas o pacote raiz
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Apenas os pacotes afetados pelo conjunto atual de alterações
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

O gerador resolve o formato de bloqueio publicável do npm, mas rejeita versões de pacotes geradas que ainda não estejam presentes em `pnpm-lock.yaml`. Isso mantém intactos os limites de revisão de idade, substituições e patches das dependências do pnpm.

Revise estes itens como sensíveis à segurança:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- conteúdos de dependências incluídos nos plugins
- qualquer diff de `package-lock.json`

Os validadores de pacotes do OpenClaw exigem shrinkwrap em novos tarballs do pacote raiz e rejeitam `package-lock.json` em pacotes publicados. O fluxo de publicação npm de plugins verifica o shrinkwrap local do plugin, instala as dependências incluídas locais do pacote e, em seguida, empacota ou publica.

## Inspeção de um pacote publicado

Pacote raiz:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Pacote de plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Contexto: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
