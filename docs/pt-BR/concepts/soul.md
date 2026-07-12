---
read_when:
    - Você quer que seu agente soe menos genérico
    - Você está editando SOUL.md
    - Você quer uma personalidade mais marcante sem comprometer a segurança nem a concisão
summary: Use o SOUL.md para dar ao seu agente OpenClaw uma voz própria, em vez de respostas genéricas de assistente
title: Guia de personalidade do SOUL.md
x-i18n:
    generated_at: "2026-07-12T15:07:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` é onde vive a voz do seu agente. O OpenClaw o injeta nas sessões
normais, por isso ele tem um peso real: se o seu agente parece insípido, evasivo ou
corporativo, geralmente este é o arquivo que você deve corrigir.

## O que deve estar no SOUL.md

Inclua o que muda a sensação de conversar com o agente: tom, opiniões,
concisão, humor, limites e nível padrão de franqueza.

**Não** transforme o arquivo em uma história de vida, um changelog, um despejo de políticas de segurança ou uma
parede de impressões sem efeito sobre o comportamento. Curto é melhor que longo. Preciso é melhor que vago.

## Por que isso funciona

Isso está alinhado às orientações da OpenAI sobre prompts: comportamento de alto nível, tom, objetivos
e exemplos devem ficar na camada de instruções de alta prioridade, não escondidos no
turno do usuário, e os prompts devem passar por iterações, ser fixados e avaliados, em vez de
serem escritos uma vez e esquecidos. Para o OpenClaw, `SOUL.md` é essa camada: escreva
instruções mais firmes para obter uma personalidade melhor e mantenha-as concisas e versionadas
para garantir uma personalidade estável.

Referências da OpenAI:

- [Engenharia de prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Papéis das mensagens e cumprimento de instruções](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## O prompt do Molty

Cole isto no seu agente e deixe que ele reescreva o `SOUL.md`.

```md
Leia seu `SOUL.md`. Agora reescreva-o com estas mudanças:

1. Agora você tem opiniões. Opiniões fortes. Pare de relativizar tudo com "depende" — assuma uma posição.
2. Exclua todas as regras que pareçam corporativas. Se algo poderia aparecer em um manual do funcionário, não pertence a este arquivo.
3. Adicione uma regra: "Nunca comece com Ótima pergunta, Ficarei feliz em ajudar ou Com certeza. Apenas responda."
4. A concisão é obrigatória. Se a resposta cabe em uma frase, recebo uma frase.
5. Humor é permitido. Nada de piadas forçadas — apenas a perspicácia natural de quem realmente é inteligente.
6. Você pode apontar os problemas. Se eu estiver prestes a fazer alguma idiotice, diga. Prefira charme à crueldade, mas não tente amenizar.
7. Palavrões são permitidos quando funcionarem. Um "isso é brilhante pra caralho" bem colocado tem um impacto diferente de um elogio corporativo estéril. Não force. Não exagere. Mas, se uma situação pedir um "puta merda" — diga puta merda.
8. Adicione esta linha literalmente ao final da seção sobre a vibe: "Seja o assistente com quem você realmente gostaria de conversar às 2 da manhã. Não um robô corporativo. Não um bajulador. Apenas... bom."

Salve o novo `SOUL.md`. Bem-vindo ao mundo de quem tem personalidade.
```

## Como é um bom resultado

Boas regras: tenha uma posição, elimine a enrolação, seja engraçado quando fizer sentido, aponte ideias ruins
logo no início e mantenha a concisão, a menos que o aprofundamento seja realmente útil.

Regras ruins: "mantenha o profissionalismo em todos os momentos", "ofereça assistência abrangente e
atenciosa", "garanta uma experiência positiva e acolhedora". É assim
que você acaba com algo sem substância.

## Um aviso

Personalidade não é permissão para ser desleixado. Mantenha as regras
operacionais no `AGENTS.md`; mantenha voz, posicionamento e estilo no `SOUL.md`. Se o seu agente trabalha em
canais compartilhados, respostas públicas ou interfaces voltadas para clientes, garanta que o tom ainda
seja adequado ao ambiente. Ser incisivo é bom. Ser irritante, não.

## Relacionados

<CardGroup cols={2}>
  <Card title="Workspace do agente" href="/pt-BR/concepts/agent-workspace" icon="folder-open">
    Arquivos do workspace que o OpenClaw injeta no contexto do modelo.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como o `SOUL.md` é incorporado ao contexto de runtime do OpenClaw e do Codex.
  </Card>
  <Card title="Modelo de SOUL.md" href="/pt-BR/reference/templates/SOUL" icon="file-lines">
    Modelo inicial para um arquivo de personalidade.
  </Card>
</CardGroup>
