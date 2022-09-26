/**
 * MIT License
 *
 * Copyright (c) 2022 NGC Corp.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */

// PipeWrench API.
import { ArrayList, BloodBodyPartType, BloodClothingType, Clothing, InventoryItem, IsoDeadBody, WeaponType, ZombRandBetween } from '@asledgehammer/pipewrench';

// PipeWrench Events API.
import * as Events from '@asledgehammer/pipewrench-events';

// @ts-ignore
const sandboxVars = SandboxVars.WorseZombieLootCondition;

function setCondition(item: InventoryItem, maxCondition: number) {
  const condition = item.getCondition();

  if (condition > 0) {
    const newCondition = Math.floor(ZombRandBetween(0, condition * maxCondition));
    item.setCondition(newCondition, false);
  }
}

Events.onHitZombie.addListener((zombie, character, bodyPartType, handWeapon) => {
  if (zombie == null) {
    return;
  }

  for (let i = 0; i < sandboxVars.clothingHolesValue; i++) {
    // @ts-ignore
    zombie.addHole(null);
  }

  if (WeaponType.getWeaponType(character) != WeaponType.barehand) {
    // @ts-ignore
    zombie.addBlood(null, true, false, false);
  }
});

Events.onZombidDead.addListener((zombie) => {
  if (zombie == null) {
    return;
  }

  const itemContainer = zombie.getInventory();
  const itemsWeapon = itemContainer.getItemsFromCategory('Weapon');
  const itemsClothing = itemContainer.getItemsFromCategory('Clothing');
  // const itemsLighter = itemContainer.getItemsFromType('Lighter');
  // const itemsMatches = itemContainer.getItemsFromType('Matches');

  if (zombie.getLastHitCount() < sandboxVars.clothingHolesValueMin) {
    const remainingHits = sandboxVars.clothingHolesValueMin - zombie.getLastHitCount();

    for (let i = 0; i < sandboxVars.clothingHolesValue * remainingHits; i++) {
      // @ts-ignore
      zombie.addHole(null);
    }

    // @ts-ignore
    zombie.addBlood(null, true, false, false);
  }

  for (let i = 0; i < itemsWeapon.size(); i++) {
    const item: InventoryItem = itemsWeapon.get(i);
    setCondition(item, sandboxVars.damageWeaponValue);
  }

  for (let i = 0; i < itemsClothing.size(); i++) {
    const item: Clothing = itemsClothing.get(i);

    if (!item.getCanHaveHoles()) {
      setCondition(item, sandboxVars.damageClothingValue);
    }
  }

  // for (let i = 0; i < itemsLighter.size(); i++) {
  //   const item: InventoryItem = itemsLighter.get(i);

  //   item.setUses(Math.floor(item.getUses() * sandboxVars.maxItemCapacity));
  // }

  // for (let i = 0; i < itemsMatches.size(); i++) {
  //   const item: InventoryItem = itemsLighter.get(i);

  //   item.setUses(Math.floor(item.getUses() * sandboxVars.maxItemCapacity));
  // }
});

Events.loadGridSquare.addListener((square) => {
  const deadBodies = square.getDeadBodys();

  for (let i = 0; i < deadBodies.size(); i++) {
    const body: IsoDeadBody = deadBodies.get(i);

    if (!body.isFakeDead()) {
      const itemContainer = body.getItemContainer();
      const itemsWeapon = itemContainer.getItemsFromCategory('Weapon');
      const itemsClothing = itemContainer.getItemsFromCategory('Clothing');
      // const itemsLighter = itemContainer.getItemsFromType('Lighter');
      // const itemsMatches = itemContainer.getItemsFromType('Matches');

      for (let j = 0; j < itemsWeapon.size(); j++) {
        const item: InventoryItem = itemsWeapon.get(j);
        setCondition(item, sandboxVars.damageWeaponValue);
      }

      // for (let j = 0; j < itemsLighter.size(); j++) {
      //   const item: InventoryItem = itemsLighter.get(j);

      //   item.setUses(Math.floor(item.getUses() * sandboxVars.maxItemCapacity));
      // }

      // for (let j = 0; j < itemsMatches.size(); j++) {
      //   const item: InventoryItem = itemsLighter.get(j);

      //   item.setUses(Math.floor(item.getUses() * sandboxVars.maxItemCapacity));
      // }

      for (let j = 0; j < itemsClothing.size(); j++) {
        const item: Clothing = itemsClothing.get(j);

        if (!item.getCanHaveHoles()) {
          setCondition(item, sandboxVars.damageClothingValue);
        } else {
          const coveredParts = item.getCoveredParts();
          const humanVisual = body.getHumanVisual();
          const visual = new ArrayList();
          visual.add(item.getVisual());

          for (let k = 0; k < coveredParts.size(); k++) {
            const coveredPart: BloodBodyPartType = coveredParts.get(k);

            for (let l = 0; l < sandboxVars.deadBodyHolesValueMin; l++) {
              BloodClothingType.addHole(
                coveredPart,
                humanVisual,
                visual
              );
            }
          }

          if (item.getHolesNumber() != 0) {
            const lostCondition = item.getCondLossPerHole();
            item.setCondition(item.getCondition() - lostCondition, false);
          }
        }
      }
    }
  }
});
