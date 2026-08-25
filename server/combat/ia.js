import { d, d10, pescaDa, mescola } from '../lib/dadi.js';
import { fasciaPerDistanza, gradoFerita, azionePerId } from './tabelle.js';

/**
 * Decide da sola cosa fa un combattente.
 *
 * Serve soprattutto ai PNG: un Master che schiera cinque teppisti non vuole
 * scegliere a mano cinque bersagli e cinque armi a ogni round. La decisione e'
 * sempre **restituita prima di essere eseguita**, cosi' resta una proposta:
 * chi guida il tavolo puo' accettarla o cambiarla.
 *
 * Non e' un'intelligenza artificiale, e' una manciata di regole della casa che
 * imitano cosa farebbe un avversario ragionevole.
 */

/** Un'arma e' utilizzabile se non e' inceppata e ha colpi (o non ne consuma). */
function armiUsabili(comb) {
  return (comb.armi || []).map((arma, idx) => ({ arma, idx }))
    .filter(({ arma, idx }) => {
      if (comb.inceppate?.[idx]) return false;
      const colpi = comb.colpiInCanna?.[idx];
      const daFuoco = /^(PST|FCL|MTR|SHG|PES)$/i.test(String(arma.tipo || ''));
      if (!daFuoco) return true;
      return colpi == null || colpi > 0;
    });
}

const eDaFuoco = (arma) => /^(PST|FCL|MTR|SHG|PES)$/i.test(String(arma?.tipo || ''));

/**
 * Sceglie il bersaglio. Nel dubbio si finisce chi e' gia' ferito — e' quello
 * che fa un avversario che vuole ridurre il numero di armi puntate contro —
 * ma non sempre, altrimenti il combattimento diventa prevedibile.
 */
function scegliBersaglio(nemici) {
  if (nemici.length === 1) return nemici[0];
  if (d10() <= 6) {
    const feriti = [...nemici].sort((a, b) => (b.ferite || 0) - (a.ferite || 0));
    if ((feriti[0].ferite || 0) > 0) return feriti[0];
  }
  return pescaDa(nemici);
}

/**
 * Propone l'azione per `comb`. Restituisce null se non c'e' niente da fare.
 * `distanza` e' quella dello scontro: senza mappa, una distanza sola per tutti
 * e' l'approssimazione che al tavolo si usa comunque.
 */
export function decidiAzione(scontro, comb, opzioni = {}) {
  const distanza = Math.max(0, Number(opzioni.distanza ?? scontro.distanza ?? 10));
  const nemici = scontro.combattenti.filter(
    (c) => c.squadra !== comb.squadra && !c.fuoriCombattimento
  );
  if (!nemici.length) return null;

  const bersaglio = scegliBersaglio(nemici);
  const usabili = armiUsabili(comb);

  // Armi da fuoco che arrivano a quella distanza.
  const aPortata = usabili
    .filter(({ arma }) => eDaFuoco(arma) && !fasciaPerDistanza(distanza, Number(arma.gittata) || 0).oltre)
    .sort((a, b) => (Number(b.arma.gittata) || 0) - (Number(a.arma.gittata) || 0));

  if (aPortata.length) {
    const { arma, idx } = aPortata[0];
    const inCanna = comb.colpiInCanna?.[idx];
    const cadenza = Number(arma.cadenza) || 1;
    const disponibili = inCanna == null ? Infinity : inCanna;

    // Con un'arma automatica e munizioni in abbondanza, ogni tanto si spara
    // raffica: costa colpi ma alza le probabilita' di mettere a segno.
    let tipo = 'fuoco';
    let colpi;
    if (cadenza >= 10 && disponibili >= 10 && d10() <= 2) {
      // Fuoco automatico raro, e mai a caricatore intero: dieci colpi bastano a
      // fare male, svuotarlo tutto lascia disarmati al turno dopo.
      tipo = 'automatico';
      colpi = Math.min(10, cadenza, disponibili);
    } else if (cadenza >= 3 && disponibili >= 3 && d10() <= 4) {
      tipo = 'raffica';
    }

    const modificatori = [];
    // Un colpo mirato solo quando conviene davvero: bersaglio scoperto e vicino.
    if (tipo === 'fuoco' && (bersaglio.riparo || 'nessuno') === 'nessuno'
        && distanza <= (Number(arma.gittata) || 0) / 4 && d10() <= 2) {
      modificatori.push('mirato');
    }

    return {
      tipo,
      bersaglio: bersaglio.id,
      armaIdx: idx,
      distanza,
      colpi,
      modificatori,
      parte: modificatori.includes('mirato') ? 'testa' : undefined,
      motivo: `${arma.nome} a ${distanza} m su ${bersaglio.nome}`,
    };
  }

  // Nessuna arma da fuoco pronta: se una e' inceppata conviene liberarla.
  const inceppata = Object.keys(comb.inceppate || {})[0];
  if (inceppata != null && d10() <= 7) {
    return {
      tipo: 'sblocca',
      armaIdx: Number(inceppata),
      motivo: `${comb.armi?.[Number(inceppata)]?.nome || 'L\'arma'} e' inceppata`,
    };
  }

  // Corpo a corpo: si arriva addosso solo se si e' vicini.
  if (distanza <= 2) {
    const bianca = usabili.find(({ arma }) => !eDaFuoco(arma));
    return {
      tipo: 'mischia',
      bersaglio: bersaglio.id,
      armaIdx: bianca ? bianca.idx : -1,
      manovra: bianca ? undefined : (d10() <= 6 ? 'pugno' : 'calcio'),
      motivo: bianca ? `${bianca.arma.nome} su ${bersaglio.nome}` : `a mani nude su ${bersaglio.nome}`,
    };
  }

  // Troppo lontano per menare le mani e senza niente con cui sparare: ci si ripara.
  return {
    tipo: 'riparo',
    riparo: (comb.riparo || 'nessuno') === 'nessuno' ? 'medio' : comb.riparo,
    motivo: 'niente con cui rispondere al fuoco',
  };
}

/** Descrizione leggibile di un'azione proposta, per mostrarla prima di eseguirla. */
export function descriviAzione(scontro, azione) {
  if (!azione) return 'nessuna azione possibile';
  const def = azionePerId(azione.tipo);
  const bersaglio = scontro.combattenti.find((c) => c.id === azione.bersaglio);
  const parti = [def?.nome || azione.tipo];
  if (bersaglio) parti.push(`su ${bersaglio.nome}`);
  if (azione.motivo) parti.push(`(${azione.motivo})`);
  return parti.join(' ');
}
