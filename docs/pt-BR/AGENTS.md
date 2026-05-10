---
x-i18n:
    generated_at: "2026-05-10T19:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Guia de documentação

Este diretório é responsável pela autoria da documentação, pelas regras de links do Mintlify e pela política de i18n da documentação.

## Regras do Mintlify

- A documentação é hospedada no Mintlify (`https://docs.openclaw.ai`).
- Links internos da documentação em `docs/**/*.md` devem permanecer relativos à raiz, sem sufixo `.md` ou `.mdx` (exemplo: `[Config](/gateway/configuration)`).
- Referências cruzadas de seções devem usar âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Títulos da documentação devem evitar travessões e apóstrofos, porque a geração de âncoras do Mintlify é frágil nesses casos.
- README e outras documentações renderizadas pelo GitHub devem manter URLs absolutas da documentação para que os links funcionem fora do Mintlify.
- O conteúdo da documentação deve permanecer genérico: sem nomes de dispositivos pessoais, hostnames ou caminhos locais; use placeholders como `user@gateway-host`.

## Regras de conteúdo da documentação

- Para documentação, textos de UI e listas de seletores, ordene serviços/provedores alfabeticamente, a menos que a seção esteja descrevendo explicitamente a ordem de runtime ou a ordem de detecção automática.
- Mantenha a nomenclatura de plugins integrados consistente com as regras de terminologia de plugins de todo o repo no `AGENTS.md` raiz.

## Documentação interna

- Documentos privados duradouros para operadores pertencem a `~/Projects/manager/docs/`.
- Documentos internos locais do repo para rascunho/espelho podem ficar sob o diretório ignorado `docs/internal/`.
- Nunca adicione páginas `docs/internal/**` à navegação em `docs/docs.json` nem crie links para elas a partir da documentação pública.
- `scripts/docs-sync-publish.mjs` exclui e remove `docs/internal/**` do repo público de publicação `openclaw/docs` se uma página for adicionada à força posteriormente.
- Documentos internos podem mencionar caminhos do repo, nomes de apps privados, nomes de itens do 1Password e runbooks, mas nunca incluir valores secretos.

## i18n da documentação

- Documentação em idiomas estrangeiros não é mantida neste repo. A saída de publicação gerada fica no repo separado `openclaw/docs` (frequentemente clonado localmente como `../openclaw-docs`).
- Não adicione nem edite documentação localizada em `docs/<locale>/**` aqui.
- Trate a documentação em inglês neste repo, junto com os arquivos de glossário, como a fonte da verdade.
- Pipeline: atualize a documentação em inglês aqui, atualize `docs/.i18n/glossary.<locale>.json` conforme necessário e então deixe a sincronização do repo de publicação e `scripts/docs-i18n` rodarem em `openclaw/docs`.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas de glossário para quaisquer novos termos técnicos, títulos de páginas ou rótulos curtos de navegação que devam permanecer em inglês ou usar uma tradução fixa.
- `pnpm docs:check-i18n-glossary` é a proteção para títulos de documentação em inglês alterados e rótulos curtos de documentos internos.
- A memória de tradução fica nos arquivos gerados `docs/.i18n/*.tm.jsonl` no repo de publicação.
- Veja `docs/.i18n/README.md`.
