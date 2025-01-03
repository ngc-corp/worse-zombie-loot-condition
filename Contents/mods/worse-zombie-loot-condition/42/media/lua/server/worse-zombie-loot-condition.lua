local sandboxVars = SandboxVars.WorseZombieLootCondition

local function setCondition(item, maxPercent)
  local maxCondition = item:getConditionMax()
  local newCondition = math.floor(ZombRandBetween(0, maxCondition * (maxPercent / 100)))
  item:setCondition(newCondition, false)
end

---@param itemContainer ItemContainer
local function updateInventory(itemContainer)
  local items = itemContainer:getItems()
  do
    local i = 0
    while i < items:size() do
      ---@type Clothing
      local item = items:get(i)
      local category = item:getCategory()
      if category == "Clothing" and not item:isCosmetic() then
        if item:getCanHaveHoles() then
          item:addRandomHole()
        else
          setCondition(item, sandboxVars.overallCondition)
        end
      end
      if category == "Weapon" then
        print("Weapon")
        setCondition(item, sandboxVars.overallCondition)
      end
      if category == "Drainable" then
        print("Drainable")
        item:setCurrentUses(ZombRandBetween(0, item:getCurrentUses()))
      end
      if category == "DrainableComboItem" then
        print("DrainableComboItem")
        item:setCurrentUses(ZombRandBetween(0, item:getCurrentUses()))
      end
      i = i + 1
    end
  end
end

---@param zombie IsoZombie
function OnZombieDead(zombie)
  local itemContainer = zombie:getInventory()
  updateInventory(itemContainer)
end

---@param zombie IsoZombie
function OnHitZombie(zombie)
  local i = 0
  while i < sandboxVars.clothingHolesValue do
    zombie:addRandomVisualDamages()
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
      ---@type ModData
      local modData = deadBody:getModData()
      if not modData.WZLC_processed and not deadBody:isFakeDead() then
        ---@type ItemContainer
        local itemContainer = deadBody:getItemContainer()
        updateInventory(itemContainer)
        modData.WZLC_processed = true
      end
      i = i + 1
    end
  end
end

Events.OnHitZombie.Add(OnHitZombie);
Events.OnZombieDead.Add(OnZombieDead);
Events.LoadGridsquare.Add(LoadGridsquare);
