local ____exports = {}
local ____pipewrench = require('lua_modules/@asledgehammer/pipewrench/PipeWrench')
local ArrayList = ____pipewrench.ArrayList
local BloodClothingType = ____pipewrench.BloodClothingType
local WeaponType = ____pipewrench.WeaponType
local ZombRandBetween = ____pipewrench.ZombRandBetween
local Events = require('lua_modules/@asledgehammer/pipewrench-events/PipeWrench-Events')
local sandboxVars = SandboxVars.WorseZombieLootCondition
local function setCondition(item, maxCondition)
    local condition = item:getCondition()
    if condition > 0 then
        local newCondition = math.floor(ZombRandBetween(0, condition * maxCondition))
        item:setCondition(newCondition, false)
    end
end
Events.onHitZombie:addListener(function(zombie, character, bodyPartType, handWeapon)
    if zombie == nil then
        return
    end
    do
        local i = 0
        while i < sandboxVars.clothingHolesValue do
            zombie:addHole(nil)
            i = i + 1
        end
    end
    if WeaponType.getWeaponType(character) ~= WeaponType.barehand then
        zombie:addBlood(nil, true, false, false)
    end
end)
Events.onZombidDead:addListener(function(zombie)
    if zombie == nil then
        return
    end
    local itemContainer = zombie:getInventory()
    local itemsWeapon = itemContainer:getItemsFromCategory("Weapon")
    local itemsClothing = itemContainer:getItemsFromCategory("Clothing")
    if zombie:getLastHitCount() < sandboxVars.clothingHolesValueMin then
        local remainingHits = sandboxVars.clothingHolesValueMin - zombie:getLastHitCount()
        do
            local i = 0
            while i < sandboxVars.clothingHolesValue * remainingHits do
                zombie:addHole(nil)
                i = i + 1
            end
        end
        zombie:addBlood(nil, true, false, false)
    end
    do
        local i = 0
        while i < itemsWeapon:size() do
            local item = itemsWeapon:get(i)
            setCondition(item, sandboxVars.damageWeaponValue)
            i = i + 1
        end
    end
    do
        local i = 0
        while i < itemsClothing:size() do
            local item = itemsClothing:get(i)
            if not item:getCanHaveHoles() then
                setCondition(item, sandboxVars.damageClothingValue)
            end
            i = i + 1
        end
    end
end)
Events.loadGridSquare:addListener(function(square)
    local deadBodies = square:getDeadBodys()
    do
        local i = 0
        while i < deadBodies:size() do
            local body = deadBodies:get(i)
            if not body:isFakeDead() then
                local itemContainer = body:getItemContainer()
                local itemsWeapon = itemContainer:getItemsFromCategory("Weapon")
                local itemsClothing = itemContainer:getItemsFromCategory("Clothing")
                do
                    local j = 0
                    while j < itemsWeapon:size() do
                        local item = itemsWeapon:get(j)
                        setCondition(item, sandboxVars.damageWeaponValue)
                        j = j + 1
                    end
                end
                do
                    local j = 0
                    while j < itemsClothing:size() do
                        local item = itemsClothing:get(j)
                        if not item:getCanHaveHoles() then
                            setCondition(item, sandboxVars.damageClothingValue)
                        else
                            local coveredParts = item:getCoveredParts()
                            local humanVisual = body:getHumanVisual()
                            local visual = ArrayList.new()
                            visual:add(item:getVisual())
                            do
                                local k = 0
                                while k < coveredParts:size() do
                                    local coveredPart = coveredParts:get(k)
                                    do
                                        local l = 0
                                        while l < sandboxVars.deadBodyHolesValueMin do
                                            BloodClothingType.addHole(coveredPart, humanVisual, visual)
                                            l = l + 1
                                        end
                                    end
                                    k = k + 1
                                end
                            end
                            if item:getHolesNumber() ~= 0 then
                                local lostCondition = item:getCondLossPerHole()
                                item:setCondition(
                                    item:getCondition() - lostCondition,
                                    false
                                )
                            end
                        end
                        j = j + 1
                    end
                end
            end
            i = i + 1
        end
    end
end)

-- PIPEWRENCH --
if _G.Events.OnPipeWrenchBoot == nil then
  _G.triggerEvent('OnPipeWrenchBoot', false)
end
_G.Events.OnPipeWrenchBoot.Add(function(____flag____)
  if ____flag____ ~= true then return end
  ArrayList = ____pipewrench.ArrayList
BloodClothingType = ____pipewrench.BloodClothingType
WeaponType = ____pipewrench.WeaponType
ZombRandBetween = ____pipewrench.ZombRandBetween
end)
----------------

return ____exports
