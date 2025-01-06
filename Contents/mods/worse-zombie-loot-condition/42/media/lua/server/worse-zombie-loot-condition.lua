local sandboxVars = SandboxVars.WorseZombieLootCondition

local function setCondition(item, maxPercent)
  local maxCondition = item:getConditionMax()
  local newCondition = math.floor(ZombRandBetween(0, maxCondition * (maxPercent / 100)))
  item:setCondition(newCondition, false)
end

---@param itemContainer ItemContainer
local function updateInventory(itemContainer, event)
  local items = itemContainer:getItems()
  do
    local i = 0
    while i < items:size() do
      ---@type InventoryItem
      local item = items:get(i)
      local category = item:getCategory()
      if category == "InventoryContainer" then
        ---@type InventoryContainer
        local _item = item
        updateInventory(_item:getItemContainer(), event)
      end
      if category == "Clothing" then
        if event == "OnZombieDead" and not sandboxVars.onZombieDeadClothingUpdate then
          --@skip item
        else
          ---@type Clothing
          local _item = item
          if not _item:isCosmetic() and not _item:getDisplayCategory() == "Accessory" then
            if _item:getCanHaveHoles() then
              local j = 0
              while j < sandboxVars.clothingHolesOnZombieDead do
                _item:addRandomHole()
                j = j + 1
              end
            else
              setCondition(_item, sandboxVars.overallCondition)
            end
          end
        end
      end
      if category == "Weapon" or category == "HandWeapon" then
        if sandboxVars.shouldDamageWeapon then
          ---@type HandWeapon
          local _item = item
          setCondition(_item, sandboxVars.overallCondition)
        end
      end
      if category == "Drainable" or category == "DrainableComboItem" then
        if sandboxVars.shouldReduceDrainable then
          ---@type DrainableComboItem
          local _item = item
          _item:setCurrentUses(ZombRandBetween(0, _item:getCurrentUses()))
        end
      end
      i = i + 1
    end
  end
end

---@param zombie IsoZombie
function OnZombieDead(zombie)
  if (zombie:isReanimatedPlayer() and not SandboxVars.shouldDamageReanimatedPlayer) then
    do return end
  end
  local itemContainer = zombie:getInventory()
  updateInventory(itemContainer, "OnZombieDead")
end

---@param zombie IsoZombie
function OnHitZombie(zombie)
  if (zombie:isReanimatedPlayer() and not SandboxVars.shouldDamageReanimatedPlayer) then
    do return end
  end
  zombie:addRandomVisualDamages()
  local i = 0
  while i < sandboxVars.clothingHolesValue do
    local bloodBodyPartTypeRandom = BloodBodyPartType.FromIndex(ZombRandBetween(0, BloodBodyPartType.MAX:index()))
    zombie:addHole(bloodBodyPartTypeRandom)
    zombie:addLotsOfDirt(bloodBodyPartTypeRandom, nil, true)
    i = i + 1
  end
end

---@param gridSquare IsoGridSquare
function LoadGridsquare(gridSquare)
  local deadBodies = gridSquare:getDeadBodys()
  do
    local i = 0
    while i < deadBodies:size() do
      local deadBody = deadBodies:get(i)
      if deadBody:isFakeDead() then
        --@skip this body
      else
        ---@type ModData
        local modData = deadBody:getModData()
        if not modData.WZLC_processed then
          ---@type ItemContainer
          local itemContainer = deadBody:getItemContainer()
          updateInventory(itemContainer, "LoadGridsquare")
          modData.WZLC_processed = true
        end
      end
      i = i + 1
    end
  end
end

Events.OnHitZombie.Add(OnHitZombie);
Events.OnZombieDead.Add(OnZombieDead);
Events.LoadGridsquare.Add(LoadGridsquare);
