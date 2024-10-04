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
import { ArrayList, BloodBodyPartType, BloodClothingType, BodyPartType, Clothing, getSquare, InventoryItem, IsoDeadBody, WeaponType, zombie, ZombRandBetween } from '@asledgehammer/pipewrench';

// PipeWrench Events API.
import * as Events from '@asledgehammer/pipewrench-events';

type ZombieDeath = {
  x: number;
  y: number;
  z: number;
};

// @ts-ignore
const sandboxVars = SandboxVars.WZLC;
const zombieDeaths: ZombieDeath[] = [];

function setCondition(item: InventoryItem, targetConditionPercent: number) {
  const maxCondition = item.getConditionMax();
  const currentCondition = item.getCondition();

  if (currentCondition > 0) {
    const newCondition = Math.floor(ZombRandBetween(0, maxCondition * 0.01 * targetConditionPercent));
    item.setCondition(newCondition, false);
  }
}

function updateInventory(itemContainer: zombie.inventory.ItemContainer, body: IsoDeadBody | null, addHoles: boolean) {
  const items = itemContainer.getItems();

  for (let i = 0; i < items.size(); i++) {
    const item: InventoryItem = items.get(i);
    const category = item.getCategory();

    if (category == 'Clothing' && item.getDisplayCategory() !== 'Accessory') {
      if (addHoles) {
        const coveredParts = (item as Clothing).getCoveredParts();
        const humanVisual = body!.getHumanVisual();
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
      }

      if ((item as Clothing).getHolesNumber() != 0) {
        const lostCondition = (item as Clothing).getCondLossPerHole();
        item.setCondition(item.getCondition() - lostCondition, false);
      }

      continue;
    }

    if (category == 'Weapon') {
      setCondition(item, sandboxVars.damageWeaponValue);
      continue;
    }

    if (category == 'Drainable') {
      // @ts-ignore
      item.setUsedDelta(ZombRandBetween(0, sandboxVars.maxItemCapacity * 0.01));
      continue;
    }

    if (category == 'DrainableComboItem') {
      // @ts-ignore
      item.setUsedDelta(ZombRandBetween(0, sandboxVars.maxItemCapacity * 0.01));
      continue;
    }
  }
}

Events.onHitZombie.addListener((zombie, character, bodyPartType, handWeapon) => {
  if (zombie == null) {
    return;
  }

  for (let i = 0; i < sandboxVars.clothingHolesValue; i++) {
    const bloodBodyPartType = BloodBodyPartType.FromIndex(bodyPartType.index());
    const bloodBodyPartTypeRandom = BloodBodyPartType.FromIndex(ZombRandBetween(0, BloodBodyPartType.MAX.index()));

    zombie.addHole(bloodBodyPartType);
    zombie.addHole(bloodBodyPartTypeRandom);

    if (WeaponType.getWeaponType(handWeapon) != WeaponType.barehand) {
      zombie.addBlood(bloodBodyPartType, true, false, false);
      zombie.addBlood(bloodBodyPartTypeRandom, true, false, false);
    }
  }
});

Events.onZombidDead.addListener((zombie) => {
  if (zombie == null) {
    return;
  }

  if (zombie.getLastHitCount() < sandboxVars.clothingHolesValueMin) {
    const remainingHits = sandboxVars.clothingHolesValueMin - zombie.getLastHitCount();

    if (remainingHits > 0) {
      for (let i = 0; i < sandboxVars.clothingHolesValue * remainingHits; i++) {
        const bloodBodyPartTypeRandom1 = BloodBodyPartType.FromIndex(ZombRandBetween(0, BloodBodyPartType.MAX.index()));
        const bloodBodyPartTypeRandom2 = BloodBodyPartType.FromIndex(ZombRandBetween(0, BloodBodyPartType.MAX.index()));

        zombie.addHole(bloodBodyPartTypeRandom1);
        zombie.addHole(bloodBodyPartTypeRandom2);
        zombie.addBlood(bloodBodyPartTypeRandom1, true, false, false);
        zombie.addBlood(bloodBodyPartTypeRandom2, true, false, false);
      }
    }
  }

  zombieDeaths.push({ x: zombie.getSquare().getX(), y: zombie.getSquare().getY(), z: zombie.getSquare().getZ() });
});

Events.onTick.addListener(() => {
  for (let i = 0; i < zombieDeaths.length - 1; i++) {
    const zombieDeath = zombieDeaths[i];
    const square = getSquare(zombieDeath.x, zombieDeath.y, zombieDeath.z);
    const deadBodies = square.getDeadBodys();

    for (let j = 0; j < deadBodies.size(); j++) {
      const deadBody: IsoDeadBody = deadBodies.get(j);
      const modData = deadBody.getModData();

      if (modData.WZLC_processed === true) {
        continue;
      }

      const itemContainer = deadBody.getItemContainer();

      updateInventory(itemContainer, null, false);
      // deadBody.sendObjectChange('ItemContainer');
      modData.WZLC_processed = true;
    }
  }

  zombieDeaths.length = 0;
});

Events.loadGridSquare.addListener((square) => {
  const deadBodies = square.getDeadBodys();

  for (let i = 0; i < deadBodies.size(); i++) {
    const deadBody: IsoDeadBody = deadBodies.get(i);
    const modData = deadBody.getModData();

    if (modData.WZLC_processed === true) {
      continue;
    }

    if (deadBody.isFakeDead()) {
      continue;
    }

    const itemContainer = deadBody.getItemContainer();

    updateInventory(itemContainer, deadBody, true);
    // deadBody.sendObjectChange('ItemContainer');
    modData.WZLC_processed = true;
  }
});
